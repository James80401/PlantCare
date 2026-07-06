type PostWithLikes = {
  likes?: Array<{ id: string }>;
  [key: string]: unknown;
};

export function mapCommunityPostsForViewer<T extends PostWithLikes>(
  posts: T[],
  viewerId?: string,
): Array<Omit<T, 'likes'> & { likedByMe: boolean }> {
  return posts.map(({ likes, ...post }) => ({
    ...post,
    likedByMe: Boolean(viewerId) && (likes?.length ?? 0) > 0,
  }));
}
