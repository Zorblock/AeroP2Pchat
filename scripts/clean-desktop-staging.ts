const relativeTargets = Deno.args;
const cwd = Deno.cwd().replaceAll("\\", "/");

for (const relativeTarget of relativeTargets) {
  const target = await Deno.realPath(relativeTarget).catch(() => "");
  if (!target) {
    continue;
  }

  const normalized = target.replaceAll("\\", "/");
  if (!normalized.startsWith(`${cwd}/dist/desktop/`)) {
    throw new Error(`Refusing to remove path outside dist/desktop: ${target}`);
  }

  const stat = await Deno.stat(target);
  if (!stat.isDirectory) {
    continue;
  }

  await Deno.remove(target, { recursive: true });
}
