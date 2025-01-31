export type Limits = {
	limit?: number;
	skip?: number;
};

export type Sort = {
	[key: string]: "asc" | "desc";
};
