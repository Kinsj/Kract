import {updateDom} from './dom';

let deletions = [];

export function pushDeletion(fiber) {
  deletions.push(fiber)
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
