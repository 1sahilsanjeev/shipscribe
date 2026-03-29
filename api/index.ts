import app from '../src/api/index.js'; // Vercel and NodeNext ESM REQUIRE the .js extension in source imports for some reasons, or we can use the source directly if configured correctly. Actually, let's use the source .ts extension if possible. Wait, the most stable way in Vercel for monorepos is to point to the source.

export default (req: any, res: any) => {
  return app(req, res);
};
