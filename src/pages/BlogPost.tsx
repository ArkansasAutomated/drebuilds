import { useParams, Link } from "react-router-dom";
import { getPost } from "@/lib/blog";
import NotFound from "./NotFound";

const BlogPost = () => {
  const { slug } = useParams<{ slug: string }>();
  const post = slug ? getPost(slug) : undefined;

  if (!post) return <NotFound />;

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-3xl mx-auto px-6 py-16">
        <p className="text-sm uppercase tracking-widest text-muted-foreground mb-2">
          Dre Builds — Field Notes
        </p>
        <h1 className="text-4xl font-bold mb-4">{post.meta.title}</h1>
        {post.meta.description && (
          <p className="text-lg text-muted-foreground mb-6">{post.meta.description}</p>
        )}
        <p className="text-xs text-muted-foreground mb-10">
          {post.meta.generated} · Generated with the Dre Builds PSEO Engine
        </p>
        {/* SAFE: bodyHtml is produced by our own deterministic renderer in
            src/lib/blog.ts over build-time-bundled markdown we authored.
            No user-generated content reaches this sink; inline() escapes
            &<> before applying a closed set of formatting replacements. */}
        <article
          className="prose prose-neutral dark:prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: post.bodyHtml }}
        />
        <div className="mt-12 flex justify-between">
          <Link to="/blog" className="text-sm text-primary hover:underline">
            ← All posts
          </Link>
          <Link to="/" className="text-sm text-primary hover:underline">
            Back to home →
          </Link>
        </div>
      </main>
    </div>
  );
};

export default BlogPost;
