console.log('index')
import { IncomingMessage, ServerResponse } from 'http'
import url from 'url'
import accepts from 'accepts'
import httpError from 'http-errors'
import {
  Source,
  parse,
  validate,
  execute,
  formatError,
  validateSchema,
  getOperationAST,
  specifiedRules,
  ASTVisitor,
  DocumentNode,
  ValidationRule,
  ValidationContext,
  GraphQLError,
  GraphQLSchema,
  GraphQLFieldResolver,
  GraphQLTypeResolver,
  ParseOptions,
} from 'graphql'

import { Response as ExpressResponse } from 'express'

import { parseBody } from './parseBody'
import { renderGraphiQL, GraphiQLOptions } from './renderGraphiQL'

type Request = IncomingMessage
type Response = ExpressResponse

interface OptionsData {
  schema: GraphQLSchema
  context?: unknown
  rootValue?: unknown
  pretty?: boolean | null
  validationRules?: ReadonlyArray<(ctx: ValidationContext) => ASTVisitor> | null
  customValidateFn?: ((schema: GraphQLSchema, documentAST: DocumentNode, rules?: ReadonlyArray<ValidationRule>) => ReadonlyArray<GraphQLError>) | null
  //   customExecuteFn?:  (<TData = ExecutionResultDataDefault>(args: ExecutionArgs) => PromiseOrValue<ExecutionResult<TData>>) | null
  customExecuteFn?: any
  customFormatErrorFn?: ((error: GraphQLError) => unknown) | null
  customParseFn?: ((source: string | Source, options?: ParseOptions) => DocumentNode) | null
  //   formatError?: ((error: GraphQLError) => unknown) | null
  formatError?: any
  extensions?: ((info: RequestInfo) => { [key: string]: unknown }) | null
  graphiql?: boolean | null
  fieldResolver?: GraphQLFieldResolver<unknown, unknown> | null
  typeResolver?: GraphQLTypeResolver<unknown, unknown> | null
}
type OptionsResult = OptionsData | Promise<OptionsData>

export interface GraphQLParams {
  query: string | null | undefined
  variables: { readonly [name: string]: unknown } | null | undefined
  operationName: string | null | undefined
  raw: boolean | null | undefined
}

export type Options = ((request: Request, response: Response, params?: GraphQLParams) => OptionsResult) | OptionsResult

export function graphqlHTTP(options: Options) {
  if (!options) {
    throw new Error('옵션 필수야아아아아아아아아아아아아아아아')
  }

  return function graphqlMiddleware(request: Request, response: Response) {
    let context: any
    let params: GraphQLParams
    let pretty: any
    let formatErrorFn = formatError
    let validateFn = validate
    let executeFn = execute
    let parseFn = parse
    let extensionsFn: any
    let showGraphiQL: boolean | undefined | null = false
    let query: any

    let documentAST: any
    let variables: any
    let operationName: any

    return getGraphQLParams(request)
      .then(
        graphQLParams => {
          params = graphQLParams
          return resolveOptions(params)
        },
        error => {
          const dummyParams = {
            query: null,
            variables: null,
            operationName: null,
            raw: null,
          }
          return resolveOptions(dummyParams).then(() => Promise.reject(error))
        }
      )
      .then(optionsData => {
        if (!optionsData.schema) {
          throw new Error('GraphQL middleware options must contain a schema.')
        }

        const schema = optionsData.schema
        const rootValue = optionsData.rootValue
        const fieldResolver = optionsData.fieldResolver
        const typeResolver = optionsData.typeResolver
        const validationRules = optionsData.validationRules || []
        const graphiql = optionsData.graphiql
        context = optionsData.context || request

        if (request.method !== 'GET' && request.method !== 'POST') {
          response.setHeader('Allow', 'GET, POST')
          throw httpError(405, 'GraphQL only supports GET and POST requests.')
        }

        query = params.query
        variables = params.variables
        operationName = params.operationName
        showGraphiQL = canDisplayGraphiQL(request, params) && graphiql

        if (!query) {
          if (showGraphiQL) {
            return null
          }
          throw httpError(400, 'Must provide query string.')
        }

        const schemaValidationErrors = validateSchema(schema)
        if (schemaValidationErrors.length > 0) {
          // Return 500: Internal Server Error if invalid schema.
          response.statusCode = 500
          return { errors: schemaValidationErrors }
        }

        const source = new Source(query, 'GraphQL request')

        // Parse source to AST, reporting any syntax error.
        try {
          documentAST = parseFn(source)
        } catch (syntaxError) {
          // Return 400: Bad Request if any syntax errors errors exist.
          response.statusCode = 400
          return { errors: [syntaxError] }
        }

        const validationErrors = validateFn(schema, documentAST, [...specifiedRules, ...validationRules])

        if (validationErrors.length > 0) {
          // Return 400: Bad Request if any validation errors exist.
          response.statusCode = 400
          return { errors: validationErrors }
        }

        if (request.method === 'GET') {
          // Determine if this GET request will perform a non-query.
          const operationAST = getOperationAST(documentAST, operationName)
          if (operationAST && operationAST.operation !== 'query') {
            // If GraphiQL can be shown, do not perform this query, but
            // provide it to GraphiQL so that the requester may perform it
            // themselves if desired.
            if (showGraphiQL) {
              return null
            }

            // Otherwise, report a 405: Method Not Allowed error.
            response.setHeader('Allow', 'POST')
            throw httpError(405, `Can only perform a ${operationAST.operation} operation from a POST request.`)
          }
        }
        // Perform the execution, reporting any errors creating the context.
        try {
          return executeFn({
            schema,
            document: documentAST,
            rootValue,
            contextValue: context,
            variableValues: variables,
            operationName,
            fieldResolver,
            typeResolver,
          })
        } catch (contextError) {
          // Return 400: Bad Request if any execution context errors exist.
          response.statusCode = 400
          return { errors: [contextError] }
        }
      })
      .then(result => {
        if (result && extensionsFn) {
          return Promise.resolve(
            extensionsFn({
              document: documentAST,
              variables,
              operationName,
              result,
              context,
            })
          ).then(extensions => {
            if (extensions && typeof extensions === 'object') {
              result = extensions
            }
            return result
          })
        }
        return result
      })
      .catch(error => {
        response.statusCode = error.status || 500
        return { errors: [error] }
      })
      .then((result: any) => {
        if (response.statusCode === 200 && result && !result.data) {
          response.statusCode = 500
        }
        // Format any encountered errors.
        if (result && result.errors) {
          result = result.errors.map(formatErrorFn)
        }

        // If allowed to show GraphiQL, present it instead of JSON.
        if (showGraphiQL) {
          const payload = renderGraphiQL({
            query,
            variables,
            operationName,
            result,
            options: typeof showGraphiQL !== 'boolean' ? showGraphiQL : {},
          })
          return sendResponse(response, 'text/html', payload)
        }

        // At this point, result is guaranteed to exist, as the only scenario
        // where it will not is when showGraphiQL is true.
        if (!result) {
          throw httpError(500, 'Internal Error')
        }

        // If "pretty" JSON isn't requested, and the server provides a
        // response.json method (express), use that directly.
        // Otherwise use the simplified sendResponse method.
        if (!pretty && typeof response.json === 'function') {
          response.json(result)
        } else {
          const payload = JSON.stringify(result, null, pretty ? 2 : 0)
          sendResponse(response, 'application/json', payload)
        }
      })
    async function resolveOptions(requestParams: any) {
      const optionsResult = typeof options === 'function' ? options(request, response, requestParams) : options
      const optionsData: OptionsData = await optionsResult

      if (!optionsData || typeof optionsData !== 'object') {
        throw new Error('GraphQL middleware option function must return an options object or a promise which will be resolved to an options object.')
      }

      if (optionsData.formatError) {
        console.warn('`formatError` is deprecated and replaced by `customFormatErrorFn`. It will be removed in version 1.0.0.')
      }

      validateFn = optionsData.customValidateFn || validateFn
      executeFn = optionsData.customExecuteFn || executeFn
      parseFn = optionsData.customParseFn || parseFn
      formatErrorFn = optionsData.customFormatErrorFn || optionsData.formatError || formatErrorFn
      extensionsFn = optionsData.extensions
      pretty = optionsData.pretty
      return optionsData
    }
  }
}

export async function getGraphQLParams(request: Request) {
  const bodyData = await parseBody(request)
  const urlData = (request.url && url.parse(request.url, true).query) || {}

  return parseGraphQLParams(urlData, bodyData)
}

function parseGraphQLParams(urlData: any, bodyData: any): GraphQLParams {
  // GraphQL Query string.
  let query = urlData.query || bodyData.query
  if (typeof query !== 'string') {
    query = null
  }

  // Parse the variables if needed.
  let variables = urlData.variables || bodyData.variables
  if (variables && typeof variables === 'string') {
    try {
      variables = JSON.parse(variables)
    } catch (error) {
      throw httpError(400, 'Variables are invalid JSON.')
    }
  } else if (typeof variables !== 'object') {
    variables = null
  }

  // Name of GraphQL operation to execute.
  let operationName = urlData.operationName || bodyData.operationName
  if (typeof operationName !== 'string') {
    operationName = null
  }

  const raw = urlData.raw !== undefined || bodyData.raw !== undefined

  return { query, variables, operationName, raw }
}

/**
 * Helper function to determine if GraphiQL can be displayed.
 */
function canDisplayGraphiQL(request: Request, params: GraphQLParams): boolean {
  // If `raw` exists, GraphiQL mode is not enabled.
  // Allowed to show GraphiQL if not requested as raw and this request
  // prefers HTML over JSON.
  return !params.raw && accepts(request).types(['json', 'html']) === 'html'
}

/**
 * Helper function for sending a response using only the core Node server APIs.
 */
function sendResponse(response: Response, type: string, data: string): void {
  const chunk = Buffer.from(data, 'utf8')
  response.setHeader('Content-Type', type + '; charset=utf-8')
  response.setHeader('Content-Length', String(chunk.length))
  response.end(chunk)
}
