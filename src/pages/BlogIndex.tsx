import { Link } from "react-router-dom";
import { getAllPosts } from "@/lib/blog";

const BlogIndex = () => {
  const posts = getAllPosts();

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-3xl mx-auto px-6 py-16">
        <p className="text-sm uppercase tracking-widest text-muted-foreground mb-2">
          Dre Builds — Field Notes
        </p>
        <h1 className="text-4xl font-bold mb-4">Blog</h1>
        <p className="text-muted-foreground mb-10">
          Practical AI automation engineering: local models, agent loops, and
          zero-marginal-cost systems.
        </p>
        <div className="space-y-8">
          {posts.map((post) => (
            <article key={post.meta.slug} className="border-b pb-8">
              <Link
                to={`/blog/${post.meta.slug}`}
                className="text-2xl font-semibold hover:underline"
              >
                {post.meta.title}
              </Link>
              {post.meta.description && (
                <p className="text-muted-foreground mt-2">{post.meta.description}</p>
              )}
              <p className="text-xs text-muted-foreground mt-3">
                {post.meta.generated}
              </p>
            </article>
          ))}
        </div>
        <div className="mt-12">
          <Link to="/" className="text-sm text-primary hover:underline">
            ← Back to home
          </Link>
        </div>
      </main>
    </div>
  );
};

export default BlogIndex;
