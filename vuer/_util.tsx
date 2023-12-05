export function findByKey(node, key: string, extra: string[] = []) {
  if (node.key === key) return node;

  const all = ['children', ...extra];

  for (const attr of all) {
    if (node[attr]) {
      for (const child of node[attr]) {
        const result = findByKey(child, key, extra);
        if (result) return result;
      }
    }
  }
}

// todo: add find parent by key
// todo: remove element from parent
export function removeByKey(node, key?: string, extra: string[] = []) {
  const all = ['children', ...extra];

  for (const attr of all) {
    if (node[attr]) {
      for (const child of node[attr]) {
        if (child.key === key) return node[attr];
        const index = node[attr].indexOf(child);

        if (index < 0) continue;
        node[attr].splice(index, 1);
        // return true to trigger update
        return true;
      }
    }
  }
}

export function addNode(scene, element, parentKey?: string): true | undefined {
  const parent = parentKey ? findByKey(scene, parentKey) : scene;
  if (parent) {
    if (!parent.children) parent.children = [];
    parent.children.push(element);
    // return true to trigger update
    return true;
  } else {
    if (!scene) return;
    if (!scene.children) scene.children = [];
    scene.children.push(element);
    // return true to trigger update
    return true;
  }
}

export function imageToBase64(img: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => { resolve(reader.result as string); };
    reader.onerror = (error) => { reject(error); };
    reader.readAsDataURL(img);
  });
}

export function jpg64ToUri(base64: string, mtype = 'image/jpeg'): string {
  return `data:${mtype};base64,${base64}`;
}
