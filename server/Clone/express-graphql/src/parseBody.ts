import { IncomingMessage } from 'http'
import zlib from 'zlib'
import getBody from 'raw-body'
import httpError from 'http-errors'
import querystring from 'querystring'
import contentType from 'content-type'

type Request = IncomingMessage & { body?: any }

export async function parseBody(req: Request): Promise<any> {
  const { body } = req

  if (typeof body === 'object' && !(body instanceof Buffer)) {
    // 익스프레스는 buffer형태를 파싱해서 뭔가 만드는 건가보네
    return body as any
  }

  if (req.headers['content-type'] === undefined) {
    return {}
  }

  const typeInfo = contentType.parse(req)

  if (typeof body === 'string' && typeInfo.type === 'application/graphql') {
    return { query: body }
  }

  if (body) {
    return {}
  }

  const rawBody = await readBody(req, typeInfo)

  async function readBody(req: any, typeInfo: any) {
    const charset = (typeInfo.parameters.charset || 'utf-8').toLowerCase()

    if (charset.slice(0, 4) !== 'utf-') {
      throw httpError(415, `Unsupported charset "${charset.toUpperCase()}".`)
    }

    const contentEncoding = req.headers['content-encoding']
    const encoding = typeof contentEncoding === 'string' ? contentEncoding.toLowerCase() : 'identity'
    const length = encoding === 'identity' ? req.headers['content-length'] : null
    const limit = 100 * 1024
    const stream = decompressed(req, encoding)

    try {
      return await getBody(stream, { encoding: charset, length, limit })
    } catch (err) {
      throw err.type === 'encoding.unsupported' ? httpError(415, `Unsupported charset "${charset.toUpperCase()}".`) : httpError(400, `Invalid body: ${err.message}.`)
    }
  }

  function decompressed(req: any, encoding: any) {
    switch (encoding) {
      case 'identity':
        return req
      case 'deflate':
        return req.pipe(zlib.createInflate())
      case 'gzip':
        return req.pipe(zlib.createGunzip())
    }
    throw httpError(415, `Unsupported content-encoding "${encoding}".`)
  }
}
