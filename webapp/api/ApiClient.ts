export default class ApiClient 
{
  private readonly baseUrl: string;

  /**
   * Creates an API client instance with a fixed base URL.
   *
   * @param baseUrl Base URL used for all request paths.
   */
  public constructor(baseUrl: string) 
  {
    this.baseUrl = baseUrl;
  }

  /**
   * Sends a GET request.
   *
   * @typeParam T Expected response payload type.
   * @param path Relative API path.
   * @returns Parsed response payload.
   */
  public async get<T>(path: string): Promise<T> 
  {
    return this.request<T>(path, {
      method: "GET",
    });
  }

  /**
   * Sends a POST request with a JSON body.
   *
   * @typeParam T Expected response payload type.
   * @param path Relative API path.
   * @param body Request payload.
   * @returns Parsed response payload.
   */
  public async post<T>(path: string, body: unknown): Promise<T> 
  {
    return this.request<T>(path, {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  /**
   * Sends a PUT request with a JSON body.
   *
   * @typeParam T Expected response payload type.
   * @param path Relative API path.
   * @param body Request payload.
   * @returns Parsed response payload.
   */
  public async put<T>(path: string, body: unknown): Promise<T> 
  {
    return this.request<T>(path, {
      method: "PUT",
      body: JSON.stringify(body),
    });
  }

  /**
   * Sends a DELETE request.
   *
   * @param path Relative API path.
   * @returns A promise that resolves when deletion succeeds.
   */
  public async delete(path: string): Promise<void> 
  {
    await this.request<unknown>(path, {
      method: "DELETE",
    });
  }

  /**
   * Sends an HTTP request and handles common response parsing and error handling.
   *
   * @typeParam T Expected response payload type.
   * @param path Relative API path.
   * @param init Request configuration passed to fetch.
   * @returns Parsed response payload.
   */
  private async request<T>(path: string, init?: RequestInit): Promise<T> 
  {
    const response = await fetch(`${this.baseUrl}${path}`, {
      headers: {
        "Content-Type": "application/json",
      },
      ...init,
    });

    if (!response.ok) 
    {
      const errorText = await response.text();
      throw new Error(errorText || `Backend request failed (${response.status})`);
    }

    if (response.status === 204) 
    {
      return undefined as T;
    }

    return (await response.json()) as T;
  }
}
