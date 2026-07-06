import { FormEvent, useCallback, useEffect, useState } from 'react';
import { FormError } from '../components/a11y/FormError';
import { StatusMessage } from '../components/a11y/StatusMessage';
import { PageHeader } from '../components/ui/PageHeader';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import {
  communityApi,
  plantsApi,
  speciesApi,
  type CommunityCommentSummary,
  type CommunityPostSummary,
} from '../services/api';
import { useAuth } from '../context/AuthContext';
import { resolveApiAssetUrl } from '../utils/apiAssets';
import { formatApiErrorMessage } from '../utils/apiError';

function PostComments({
  postId,
  commentCount,
  currentUserId,
}: {
  postId: string;
  commentCount: number;
  currentUserId?: string;
}) {
  const [open, setOpen] = useState(false);
  const [comments, setComments] = useState<CommunityCommentSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [body, setBody] = useState('');
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await communityApi.listComments(postId);
      setComments(data);
    } catch (err) {
      setError(formatApiErrorMessage(err, 'Could not load comments.'));
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    if (open) load();
  }, [open, load]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!body.trim()) return;
    setPosting(true);
    try {
      await communityApi.createComment(postId, body.trim());
      setBody('');
      await load();
    } catch (err) {
      setError(formatApiErrorMessage(err, 'Could not post comment.'));
    } finally {
      setPosting(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!confirm('Delete this comment? This removes it from the community feed.')) return;
    try {
      await communityApi.deleteComment(commentId);
      await load();
    } catch (err) {
      setError(formatApiErrorMessage(err, 'Could not delete comment.'));
    }
  };

  return (
    <div className="border-t border-emerald-50 pt-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="text-xs font-semibold text-emerald-800 hover:underline"
        aria-expanded={open}
        aria-controls={`comments-${postId}`}
      >
        {open ? 'Hide' : 'View'} comments ({commentCount})
      </button>
      {open ? (
        <div id={`comments-${postId}`} className="mt-2 space-y-2" role="region" aria-label="Comments">
          {loading ? (
            <p className="text-xs text-gray-500">Loading comments...</p>
          ) : comments.length === 0 ? (
            <p className="text-xs text-gray-500">No comments yet.</p>
          ) : (
            <ul className="space-y-2">
              {comments.map((c) => (
                <li key={c.id} className="rounded-xl bg-emerald-50/60 px-3 py-2">
                  <p className="text-xs font-semibold text-emerald-900">
                    {c.author?.name || 'Gardener'}
                  </p>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{c.body}</p>
                  {c.author?.id === currentUserId ? (
                    <button
                      type="button"
                      onClick={() => handleDelete(c.id)}
                      className="mt-1 text-xs font-semibold text-red-700 hover:underline"
                    >
                      Delete
                    </button>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
          <form onSubmit={handleSubmit} className="flex flex-col gap-2 sm:flex-row">
            <label className="sr-only" htmlFor={`comment-${postId}`}>
              Add a comment
            </label>
            <input
              id={`comment-${postId}`}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Add a comment..."
              className="min-w-0 flex-1 rounded-xl border border-emerald-100 px-3 py-2 text-sm"
            />
            <Button type="submit" size="sm" disabled={posting || !body.trim()}>
              {posting ? 'Posting...' : 'Reply'}
            </Button>
          </form>
          {error ? <FormError className="text-xs">{error}</FormError> : null}
        </div>
      ) : null}
    </div>
  );
}

const PAGE_SIZE = 15;

export default function Community() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<CommunityPostSummary[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [body, setBody] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [speciesQuery, setSpeciesQuery] = useState('');
  const [speciesId, setSpeciesId] = useState('');
  const [speciesOptions, setSpeciesOptions] = useState<Array<{ id: string; commonName: string }>>([]);
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    if (!imageFile) {
      setImagePreview(null);
      return;
    }
    const objectUrl = URL.createObjectURL(imageFile);
    setImagePreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [imageFile]);

  const loadPage = useCallback(async (cursor?: string) => {
    const loadingMorePage = Boolean(cursor);
    if (loadingMorePage) setLoadingMore(true);
    else setLoading(true);
    setError('');
    try {
      const { data } = await communityApi.listPosts({ limit: PAGE_SIZE, cursor });
      setPosts((current) => (loadingMorePage ? [...current, ...data.posts] : data.posts));
      setNextCursor(data.nextCursor);
      setHasMore(data.hasMore);
    } catch (err) {
      setError(
        formatApiErrorMessage(
          err,
          loadingMorePage ? 'Could not load more posts.' : 'Could not load community posts.',
        ),
      );
    } finally {
      if (loadingMorePage) setLoadingMore(false);
      else setLoading(false);
    }
  }, []);

  const load = useCallback(() => loadPage(), [loadPage]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (speciesQuery.trim().length < 2) {
      setSpeciesOptions([]);
      return;
    }
    const timer = window.setTimeout(() => {
      speciesApi.search(speciesQuery.trim()).then((r) => {
        setSpeciesOptions(
          (r.data as Array<{ id: string; commonName: string }>).slice(0, 6),
        );
      });
    }, 300);
    return () => window.clearTimeout(timer);
  }, [speciesQuery]);

  const handlePost = async (e: FormEvent) => {
    e.preventDefault();
    if (!body.trim()) return;
    setPosting(true);
    try {
      let imageUrl: string | undefined;
      if (imageFile) {
        const upload = await plantsApi.upload(imageFile);
        imageUrl = upload.data.url;
      }
      await communityApi.createPost({
        body: body.trim(),
        speciesId: speciesId || undefined,
        imageUrl,
      });
      setBody('');
      setImageFile(null);
      setImagePreview(null);
      setSpeciesId('');
      setSpeciesQuery('');
      await load();
    } catch (err) {
      setError(formatApiErrorMessage(err, 'Could not publish your post.'));
    } finally {
      setPosting(false);
    }
  };

  const handleDelete = async (postId: string) => {
    if (!confirm('Delete this post? This removes the post, photo, likes, and comments from the feed.')) return;
    try {
      await communityApi.deletePost(postId);
      await load();
    } catch (err) {
      setError(formatApiErrorMessage(err, 'Could not delete post.'));
    }
  };

  const handleLike = async (postId: string) => {
    try {
      await communityApi.toggleLike(postId);
      await load();
    } catch (err) {
      setError(formatApiErrorMessage(err, 'Could not update like.'));
    }
  };

  return (
    <div>
      <PageHeader
        eyebrow="Community"
        title="Plant tips & wins"
        description="Share care notes with other gardeners. Link a species when your tip is plant-specific."
        help="community"
      />

      <Card className="space-y-3">
        <div>
          <h2 className="font-semibold text-emerald-950">New post</h2>
          <p className="mt-1 text-sm leading-6 text-gray-600">
            Keep posts practical and plant-care focused. Photos are optional, and species tags help
            other gardeners find relevant advice.
          </p>
        </div>
        <form onSubmit={handlePost} className="space-y-3">
          <label className="block">
            <span className="sr-only">Post body</span>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="What worked in your care routine this week?"
              rows={4}
              className="w-full rounded-2xl border border-emerald-100 px-3 py-2 text-sm"
            />
          </label>
          <div>
            <label className="text-xs font-semibold text-emerald-800">Species (optional)</label>
            <input
              value={speciesQuery}
              onChange={(e) => {
                setSpeciesQuery(e.target.value);
                setSpeciesId('');
              }}
              placeholder="Search species to tag..."
              className="mt-1 w-full rounded-2xl border border-emerald-100 px-3 py-2 text-sm"
            />
            {speciesOptions.length > 0 ? (
              <ul className="mt-1 rounded-xl border border-emerald-100 bg-white shadow-sm">
                {speciesOptions.map((species) => (
                  <li key={species.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setSpeciesId(species.id);
                        setSpeciesQuery(species.commonName);
                        setSpeciesOptions([]);
                      }}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-emerald-50"
                    >
                      {species.commonName}
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold text-emerald-800" htmlFor="community-image">
              Photo (optional)
            </label>
            <input
              id="community-image"
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0] ?? null;
                setImageFile(file);
              }}
              className="w-full rounded-2xl border border-emerald-100 px-3 py-2 text-sm file:mr-3 file:rounded-xl file:border-0 file:bg-emerald-50 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-emerald-800"
            />
            {imagePreview ? (
              <div className="space-y-2">
                <img
                  src={imagePreview}
                  alt="Post preview"
                  loading="lazy"
                  className="max-h-56 w-full rounded-2xl border border-emerald-100 object-cover"
                />
                <button
                  type="button"
                  onClick={() => setImageFile(null)}
                  className="text-xs font-semibold text-red-700 hover:underline"
                >
                  Remove photo
                </button>
              </div>
            ) : null}
          </div>
          <Button type="submit" fullWidth disabled={posting || !body.trim()}>
            {posting ? 'Posting...' : 'Share with community'}
          </Button>
        </form>
      </Card>

      {error ? <FormError>{error}</FormError> : null}

      {loading ? (
        <StatusMessage>Loading feed...</StatusMessage>
      ) : posts.length === 0 ? (
        <p className="rounded-2xl border border-emerald-100 bg-white p-6 text-center text-sm text-gray-500">
          No posts yet. Share a practical care tip, plant win, or recovery note to start the feed.
        </p>
      ) : (
        <section aria-label="Community feed">
        <ul className="space-y-3">
          {posts.map((post) => (
            <li key={post.id}>
              <article aria-labelledby={`post-${post.id}-author`}>
              <Card className="space-y-2">
                <div>
                  <p id={`post-${post.id}-author`} className="text-sm font-semibold text-emerald-900">
                    {post.author?.name || 'Gardener'}
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(post.createdAt).toLocaleString()}
                  </p>
                </div>
                {post.species ? (
                  <span className="inline-block rounded-full bg-lime-100 px-2.5 py-0.5 text-xs font-semibold text-lime-900">
                    {post.species.commonName}
                  </span>
                ) : null}
                {post.imageUrl ? (
                  <img
                    src={resolveApiAssetUrl(post.imageUrl) ?? undefined}
                    alt={`Photo shared by ${post.author?.name || 'gardener'}`}
                    className="max-h-96 w-full rounded-2xl border border-emerald-100 object-cover"
                    loading="lazy"
                  />
                ) : null}
                <p className="text-sm leading-6 text-gray-700 whitespace-pre-wrap">{post.body}</p>
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleLike(post.id)}
                    className={`inline-flex min-h-11 items-center text-xs font-semibold ${
                      post.likedByMe ? 'text-rose-700' : 'text-emerald-800 hover:underline'
                    }`}
                    aria-pressed={Boolean(post.likedByMe)}
                  >
                    {post.likedByMe ? 'Liked' : 'Like'} ({post._count?.likes ?? 0})
                  </button>
                  <span className="text-xs text-gray-500">
                    {post._count?.comments ?? 0} comments
                  </span>
                </div>
                <PostComments
                  postId={post.id}
                  commentCount={post._count?.comments ?? 0}
                  currentUserId={user?.id}
                />
                {post.author?.id === user?.id ? (
                  <button
                    type="button"
                    onClick={() => handleDelete(post.id)}
                    aria-label="Delete this community post"
                    className="text-xs font-semibold text-red-700 hover:underline"
                  >
                    Delete
                  </button>
                ) : null}
              </Card>
              </article>
            </li>
          ))}
        </ul>
        {hasMore ? (
          <div className="mt-4 flex justify-center">
            <Button
              type="button"
              variant="secondary"
              disabled={loadingMore || !nextCursor}
              aria-busy={loadingMore}
              onClick={() => nextCursor && loadPage(nextCursor)}
            >
              {loadingMore ? 'Loading...' : 'Load more posts'}
            </Button>
          </div>
        ) : null}
        </section>
      )}
    </div>
  );
}
