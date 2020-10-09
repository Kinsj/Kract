import renderFiberTree, {pushDeletion} from './render';
import createDom from './createDom';

let wipFiberRoot = null;
let nextUnitOfWork = null;
let finishedFiberRoot = null;


function reconcileChildren(wipFiber, elements) {
  let index = 0;
  let oldFiber = wipFiber.alternate && wipFiber.alternate.child;
  let prevSibling = null;

  while (index < elements.length || oldFiber !== null) {  // 此处oldFiber 没有被同步迭代，在更新时应该会有问题
    const element = elements[index];
    let newFiber = null;

    // compare oldFiber to element
    const sameType = oldFiber && element && element.type === oldFiber.type;

    if (sameType) { // 类型一致，直接更新节点
      newFiber = {
        type: oldFiber.type,
        props: element.props,
        dom: oldFiber.dom,
        parent: wipFiber,
        alternate: oldFiber,
        effectTag: 'UPDATE',
      };
    }

    if (!sameType) { // 类型不一致
      if (element) { // 有新节点则创建新节点
        newFiber = {
          type: element.type,
          props: element.props,
          dom: null,
          parent: wipFiber,
          alternate: null,
          effectTag: 'PLACEMENT',
        };
      }
      if (oldFiber) { // 有老节点则删除老节点
        oldFiber.effectTag = 'DELETION';
        pushDeletion(oldFiber);
      }
    }

    if (index === 0) {
      wipFiber.child = newFiber;
    } else {
      prevSibling.subling = newFiber;
    }

    prevSibling = newFiber;
    index++;
  }
}

function performUnitOfWork(fiber) {
  // fiber 为当前节点，
  // 首先把当前节点渲染到dom中去，记录父子关系，
  // 然后把children创建成新的fiber， 并记录children的兄弟关系
  // 然后找到下一个fiber，将其返回
  // 下一个fiber的寻找逻辑很简单，如果有child，就返回child
  // 如果没有child，就返回兄弟
  // 如果没有兄弟就返回parent的兄弟，再没有就再返回parent的parent的兄弟。直到没有为止


  // add dom node
  if (!fiber.dom) {
    fiber.dom = createDom(fiber);  // 在内存中创建dom节点
  }

  // create new fibers
  const elements = fiber.props.children;

  reconcileChildren(fiber, elements);

  // return next unit of work
  if (fiber.child) {
    return fiber.child;
  }
  let nextFiber = fiber;
  while (nextFiber) {
    if (nextFiber.sibling) {
      return nextFiber.sibling;
    }
    nextFiber = nextFiber.parent;
  }
}

export function setWipRoot(fiber) {
  const _fiber = {
    ...fiber,
    alternate: finishedFiberRoot,  // 将旧fiber tree 记录在 alternate里
  };
  wipFiberRoot = _fiber;
  nextUnitOfWork = _fiber;
}


// Concurrent Mode, 利用 requestIdleCallback 来实现浏览器空闲调度
// react 本身没有使用 requestIdleCallback，react 用的是 scheduler package
// https://github.com/facebook/react/tree/master/packages/scheduler
function workLoop(deadline) {
  while (nextUnitOfWork && deadline.timeRemaining() >= 1) {
    nextUnitOfWork = performUnitOfWork(
      nextUnitOfWork
    );
  }

  // 如果完成全部unit，并且存在 wipFiberRoot，则渲染这个 fiber tree
  if (!nextUnitOfWork && wipFiberRoot) {
    renderFiberTree(wipFiberRoot);
    finishedFiberRoot = wipFiberRoot;
    wipFiberRoot = null;
  }
  requestIdleCallback(workLoop);
}

requestIdleCallback(workLoop);