import { FormEvent, useCallback, useEffect, useState } from 'react';
import { PageHeader } from '../components/ui/PageHeader';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { communityApi, speciesApi, type CommunityPostSummary } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Community() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<CommunityPostSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [body, setBody] = useState('');
  const [speciesQuery, setSpeciesQuery] = useState('');
  const [speciesId, setSpeciesId] = useState('');
  const [speciesOptions, setSpeciesOptions] = useState<Array<{ id: string; commonName: string }>>([]);
  const [posting, setPosting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await communityApi.listPosts(40);
      setPosts(data);
    } catch {
      setError('Could not load community posts.');
    } finally {
      setLoading(false);
    }
  }, []);

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
      await communityApi.createPost({
        body: body.trim(),
        speciesId: speciesId || undefined,
      });
      setBody('');
      setSpeciesId('');
      setSpeciesQuery('');
      await load();
    } catch {
      setError('Could not publish your post.');
    } finally {
      setPosting(false);
    }
  };

  const handleDelete = async (postId: string) => {
    if (!confirm('Delete this post?')) return;
    try {
      await communityApi.deletePost(postId);
      await load();
    } catch {
      setError('Could not delete post.');
    }
  };

  return (
    <div>
      <PageHeader
        eyebrow="Community"
        title="Plant tips & wins"
        description="Share care notes with other gardeners. Link a species when your tip is plant-specific."
      />

      <Card className="space-y-3">
        <h2 className="font-semibold text-emerald-950">New post</h2>
        <form onSubmit={handlePost} className="space-y-3">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="What worked in your care routine this week?"
            rows={4}
            className="w-full rounded-2xl border border-emerald-100 px-3 py-2 text-sm"
          />
          <div>
            <label className="text-xs font-semibold text-emerald-800">Species (optional)</label>
            <input
              value={speciesQuery}
              onChange={(e) => {
                setSpeciesQuery(e.target.value);
                setSpeciesId('');
              }}
              placeholder="Search species to tag…"
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
          <Button type="submit" fullWidth disabled={posting || !body.trim()}>
            {posting ? 'Posting…' : 'Share with community'}
          </Button>
        </form>
      </Card>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {loading ? (
        <p className="text-sm text-gray-500">Loading feed…</p>
      ) : posts.length === 0 ? (
        <p className="rounded-2xl border border-emerald-100 bg-white p-6 text-center text-sm text-gray-500">
          No posts yet — be the first to share a tip.
        </p>
      ) : (
        <ul className="space-y-3">
          {posts.map((post) => (
            <li key={post.id}>
              <Card className="space-y-2">
                <div>
                  <p className="text-sm font-semibold text-emerald-900">
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
                <p className="text-sm leading-6 text-gray-700 whitespace-pre-wrap">{post.body}</p>
                <p className="text-xs text-gray-500">
                  {post._count?.likes ?? 0} likes · {post._count?.comments ?? 0} comments
                </p>
                {post.author?.id === user?.id ? (
                  <button
                    type="button"
                    onClick={() => handleDelete(post.id)}
                    className="text-xs font-semibold text-red-700 hover:underline"
                  >
                    Delete
                  </button>
                ) : null}
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
