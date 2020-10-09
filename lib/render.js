let deletions = [];

const isEvent = key => key.startsWith('on');
const isProperty = key =>
  key !== 'children' && !isEvent(key);
const isNew = (prev, next) => key =>
  prev[key] !== next[key];
const isGone = (prev, next) => key => !(key in next);

export function pushDeletion(fiber) {
  deletions.push(fiber)
}

function updateDom(dom, prevProps, nextProps) {
  //Remove old or changed event listeners
  Object.keys(prevProps)
    .filter(isEvent)
    .filter(
      key =>
        !(key in nextProps) ||
        isNew(prevProps, nextProps)(key)
    )
    .forEach(name => {
      const eventType = name
        .toLowerCase()
        .substring(2);
      dom.removeEventListener(
        eventType,
        prevProps[name]
      );
    });

  // Remove old properties
  Object.keys(prevProps)
    .filter(isProperty)
    .filter(isGone(prevProps, nextProps))
    .forEach(name => {
      dom[name] = '';
    });

  // Set new or changed properties
  Object.keys(nextProps)
    .filter(isProperty)
    .filter(isNew(prevProps, nextProps))
    .forEach(name => {
      dom[name] = nextProps[name];
    });

  // Add event listeners
  Object.keys(nextProps)
    .filter(isEvent)
    .filter(isNew(prevProps, nextProps))
    .forEach(name => {
      const eventType = name
        .toLowerCase()
        .substring(2);
      dom.addEventListener(
        eventType,
        nextProps[name]
      );
    });
}

function renderFiber(fiber) {
  if (!fiber) return;

  const domParent = fiber.parent.dom;
  // 删除操作单独执行，不递归
  if (fiber.effectTag === 'DELETION') {
    domParent.removeChild(fiber.dom);
    return;
  }

  if (fiber.effectTag === 'PLACEMENT' && fiber.dom !== null) {
    domParent.appendChild(fiber.dom);
  } else if (fiber.effectTag === 'UPDATE' && fiber.dom != null) {
    updateDom(fiber.dom, fiber.alternate.props, fiber.props);
  }

  renderFiber(fiber.child);
  renderFiber(fiber.sibling);
}

function renderFiberTree(wipFiberRoot) {
  deletions.forEach(renderFiber);
  renderFiber(wipFiberRoot.child);
}



export default renderFiberTree;
