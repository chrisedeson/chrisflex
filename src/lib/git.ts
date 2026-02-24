// Git operations — NO AI co-author attribution, ever
import { simpleGit } from 'simple-git';
import dayjs from 'dayjs';

function getGit(cwd?: string) {
  return simpleGit(cwd ?? process.cwd());
}

/**
 * Commit changes with clean message — NO co-authored-by, NO AI attribution
 */
export async function commitChanges(
  message: string,
  files: string[],
  cwd?: string
): Promise<string> {
  const git = getGit(cwd);
  await git.add(files);
  const result = await git.commit(message);
  return result.commit;
}

/**
 * Get current branch name
 */
export async function getCurrentBranch(cwd?: string): Promise<string> {
  const git = getGit(cwd);
  const branch = await git.revparse(['--abbrev-ref', 'HEAD']);
  return branch.trim();
}

/**
 * Get short commit hash
 */
export async function getShortHash(cwd?: string): Promise<string> {
  const git = getGit(cwd);
  const hash = await git.revparse(['--short', 'HEAD']);
  return hash.trim();
}

/**
 * Check if we're in a git repo
 */
export async function isGitRepo(cwd?: string): Promise<boolean> {
  try {
    const git = getGit(cwd);
    await git.revparse(['--is-inside-work-tree']);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get recent commit messages (for style matching)
 */
export async function getRecentCommits(
  count: number = 5,
  cwd?: string
): Promise<{ hash: string; message: string; date: string }[]> {
  const git = getGit(cwd);
  const log = await git.log({ maxCount: count });
  return log.all.map((c: { hash: string; message: string; date: string }) => ({
    hash: c.hash.slice(0, 7),
    message: c.message,
    date: dayjs(c.date).format('YYYY-MM-DD HH:mm'),
  }));
}

/**
 * Get list of modified files (staged + unstaged)
 */
export async function getModifiedFiles(
  cwd?: string
): Promise<{ staged: string[]; unstaged: string[]; untracked: string[] }> {
  const git = getGit(cwd);
  const status = await git.status();
  return {
    staged: status.staged,
    unstaged: status.modified,
    untracked: status.not_added,
  };
}
