import {updateDom} from './dom';

let deletions = [];

export function pushDeletion(fiber) {
  deletions.push(fiber);
}

// 找到fiber的parentDom，因为function Component并没有实体的dom节点
// 所以function Component的children的parentDom需要再向上找，直到找到有dom的fiber
function getParentDom(fiber) {
  let domParentFiber = fiber.parent;
  while (!domParentFiber.dom) {
    domParentFiber = domParentFiber.parent;
  }
  return domParentFiber.dom;
}

// function Component没有实体dom，且只能有一个child。
// 所以如果当前fiber是个 FC，就递归到有dom的child，删掉这个dom就行
function commitDeletion(fiber, domParent) {
  if (fiber.dom) {
    domParent.removeChild(fiber.dom);
  } else {
    commitDeletion(fiber.child, domParent);
  }
}


function renderFiber(fiber) {
  if (!fiber) return;

  const domParent = getParentDom(fiber);

  // 删除操作单独执行，不递归
  if (fiber.effectTag === 'DELETION') {
    commitDeletion(fiber, domParent);
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
