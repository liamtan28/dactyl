run-example:
	deno run --allow-net -c example/tsconfig.json example/index.ts
test:
	deno test -c tsconfig.json