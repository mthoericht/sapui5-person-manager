export default class ApiClient {
	private readonly baseUrl: string;

	public constructor(baseUrl: string) {
		this.baseUrl = baseUrl;
	}

	public async get<T>(path: string): Promise<T> {
		return this.request<T>(path, {
			method: "GET"
		});
	}

	public async post<T>(path: string, body: unknown): Promise<T> {
		return this.request<T>(path, {
			method: "POST",
			body: JSON.stringify(body)
		});
	}

	public async put<T>(path: string, body: unknown): Promise<T> {
		return this.request<T>(path, {
			method: "PUT",
			body: JSON.stringify(body)
		});
	}

	public async delete(path: string): Promise<void> {
		await this.request<unknown>(path, {
			method: "DELETE"
		});
	}

	private async request<T>(path: string, init?: RequestInit): Promise<T> {
		const response = await fetch(`${this.baseUrl}${path}`, {
			headers: {
				"Content-Type": "application/json"
			},
			...init
		});

		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(errorText || `Backend request failed (${response.status})`);
		}

		if (response.status === 204) {
			return undefined as T;
		}

		return (await response.json()) as T;
	}
}

