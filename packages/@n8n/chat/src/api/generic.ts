async function getAccessToken() {
	return '';
}

export async function authenticatedFetch<T>(...args: Parameters<typeof fetch>): Promise<T> {
	const accessToken = await getAccessToken();

	// Check if body is form data and if so set content type to undefined
	const body = args[1]?.body;
	const headers = {
		'Content-Type': 'application/json',
		...(accessToken ? { authorization: `Bearer ${accessToken}` } : {}),
		...args[1]?.headers,
	};

	if (body instanceof FormData && 'Content-Type' in headers) {
		delete headers['Content-Type'];
	}
	const response = await fetch(args[0], {
		...args[1],
		mode: 'cors',
		cache: 'no-cache',
		headers,
	});

	return (await response.json()) as T;
}

export async function get<T>(url: string, query: object = {}, options: RequestInit = {}) {
	let resolvedUrl = url;
	if (Object.keys(query).length > 0) {
		resolvedUrl = `${resolvedUrl}?${new URLSearchParams(
			query as Record<string, string>,
		).toString()}`;
	}

	return await authenticatedFetch<T>(resolvedUrl, { ...options, method: 'GET' });
}

export async function post<T>(url: string, body: object = {}, options: RequestInit = {}) {
	return await authenticatedFetch<T>(url, {
		...options,
		method: 'POST',
		body: JSON.stringify(body),
	});
}
export async function postWithFiles<T>(
	url: string,
	body: Record<string, unknown> = {},
	files: File[] = [],
	options: RequestInit = {},
) {
	const formData = new FormData();

	for (const key in body) {
		formData.append(key, body[key] as string);
	}

	for (const file of files) {
		formData.append('files', file);
	}

	return await authenticatedFetch<T>(url, {
		...options,
		method: 'POST',
		body: formData,
		headers: {
			// 'Content-Type': 'multipart/form-data',
		},
	});
}

export async function put<T>(url: string, body: object = {}, options: RequestInit = {}) {
	return await authenticatedFetch<T>(url, {
		...options,
		method: 'PUT',
		body: JSON.stringify(body),
	});
}

export async function patch<T>(url: string, body: object = {}, options: RequestInit = {}) {
	return await authenticatedFetch<T>(url, {
		...options,
		method: 'PATCH',
		body: JSON.stringify(body),
	});
}

export async function del<T>(url: string, body: object = {}, options: RequestInit = {}) {
	return await authenticatedFetch<T>(url, {
		...options,
		method: 'DELETE',
		body: JSON.stringify(body),
	});
}
