import renderFiberTree, {pushDeletion} from './render';
import {createDom} from './dom';
import {resetHookIndex} from './kract';

let wipFiberRoot = null;
let nextUnitOfWork = null;
let finishedFiberRoot = null;
let wipFiber = null;
export const getWipFiber = () => wipFiber;
export const getFinishedFiberRoot = () => finishedFiberRoot;


function reconcileChildren(wipFiber, elements) {
  let index = 0;
  let oldFiber = wipFiber.alternate && wipFiber.alternate.child;
  let prevSibling = null;

  while (index < elements.length || oldFiber) {
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
    // debugger
    if (index === 0) {
      wipFiber.child = newFiber;
    } else {
      prevSibling.sibling = newFiber;
    }

    prevSibling = newFiber;
    oldFiber = oldFiber && oldFiber.sibling;
    index++;
  }
}

const isFunctionComponent = fiber => fiber.type instanceof Function;


function updateHostComponent(fiber) {
  if (!fiber.dom) {
    fiber.dom = createDom(fiber);
  }
  reconcileChildren(fiber, fiber.props.children);  // 将当前fiber的children 构造成 fiber节点
}

function updateFunctionComponent(fiber) {

  // useState 获取fiber节点的hooks数组
  wipFiber = fiber;
  wipFiber.hooks = [];
  resetHookIndex();

  // function Component 和 普通 dom节点的区别在于：
  // 1.children是执行后return来的
  // 2.没有实体的dom

  const children = [fiber.type(fiber.props)]; // fiber.type 就是function本身
  reconcileChildren(fiber, children);
}

function performUnitOfWork(fiber) {
  // fiber 为当前节点，fiber 和 vnode 的区别在于记录了 父子/兄弟关系，且记录了渲染所需执行的操作（增删改）
  // 每次 performUintOfWork 都会把当前fiber的children构造成fiber节点并返回下一个fiber
  // 下一个fiber的寻找逻辑很简单，如果有child，就返回child
  // 如果没有child，就返回兄弟
  // 如果没有兄弟就返回parent的兄弟，再没有就再返回parent的parent的兄弟。直到没有为止

  // 判断是否是个 function Component
  if (isFunctionComponent(fiber)) {
    updateFunctionComponent(fiber);
  } else {
    updateHostComponent(fiber);
  }

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
    alternate: finishedFiberRoot,  // 将旧fiber tree 记录在 alternate里
    ...fiber,
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