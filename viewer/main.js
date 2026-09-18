const params = new URLSearchParams(location.search);

export const request = {
  type: params.get('type'),
  id: params.get('id')
};

export async function main() {
  // Viewer bootstrap entrypoint.
}

await main();
