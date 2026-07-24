export class ApiHelper {
  /** @param {import('@playwright/test').APIRequestContext} request */
  constructor(request) {
    this.request = request;
  }

  async get(path, options = {}) {
    const response = await this.request.get(path, options);
    await this.assertSuccessful(response);
    return response;
  }

  async post(path, data, options = {}) {
    const response = await this.request.post(path, { ...options, data });
    await this.assertSuccessful(response);
    return response;
  }

  async assertSuccessful(response) {
    if (!response.ok()) {
      throw new Error(`API request failed: ${response.status()} ${response.url()}`);
    }
  }
}
