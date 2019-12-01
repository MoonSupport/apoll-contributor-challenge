const { RESTDataSource } = require('apollo-datasource-rest')

class MoviesAPI extends RESTDataSource {
  constructor() {
    super()
    this.baseURL = 'https://movies-api.example.com/'
  }

  async getMovie(id) {
    return this.get(`movies/${id}`)
  }

  async getMostViewedMovies(limit = 10) {
    const data = await this.get('movies', {
      per_page: limit,
      order_by: 'most_viewed',
    })
    return data.results
  }
}

class PersonalizationAPI extends RESTDataSource {
    constructor() {
      super();
      this.baseURL = 'https://personalization-api.example.com/';
    }

    willSendRequest(request) {
      request.headers.set('Authorization', this.context.token);
    }

    private progressLoader = new DataLoader(async (ids) => {
      const progressList = await this.get('progress', {
        ids: ids.join(','),
      });
      return ids.map(id =>
        progressList.find((progress) => progress.id === id),
      );
    });

    async getProgressFor(id) {
      return this.progressLoader.load(id);
    }
