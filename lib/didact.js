function createElement(type, props, ...children) {
  return {
    type,
    props: {
      ...props,
      children: children.map(child =>
        typeof child === 'object'
          ? child
          : createTextElement(child)
      )
    }
  };
}

function createTextElement(text) {
  return {
    type: 'TEXT_ELEMENT',
    props: {
      nodeValue: text,
      children: []
    }
  };
}

function createDom(fiber) {
  const dom = fiber.type === 'TEXT_ELEMENT'
    ? document.createTextNode('')
    : document.createElement(fiber.type);

  // assign props to dom
  const isProperty = key => key !== 'children';
  Object.keys(fiber.props)
    .filter(isProperty)
    .forEach(name => {
      dom[name] = fiber.props[name];
    });

  return dom;
}

const isEvent = key => key.startsWith('on');
const isProperty = key =>
  key !== 'children' && !isEvent(key);
const isNew = (prev, next) => key =>
  prev[key] !== next[key];
const isGone = (prev, next) => key => !(key in next);

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
​
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

function commitRoot() {
  deletions.forEach(commitWork);
  commitWork(wipRoot);
  currentRoot = wipRoot; // 记录 已渲染完成的 fiber tree
  wipRoot = null;
}

// 递归渲染
function commitWork(fiber) {
  if (!fiber) {
    return;
  }
  const domParent = fiber.parent.dom;
  if (fiber.effectTag === 'PLACEMENT' && fiber.dom !== null) {
    domParent.appendChild(fiber.dom);
  } else if (fiber.effectTag === 'DELETION') {
    domParent.removeChild(fiber.dom);
  } else if (fiber.effectTag === 'UPDATE' && fiber.dom != null) {
    updateDom(fiber.dom, fiber.alternate.props, fiber.props);
  }
  commitWork(fiber.child);
  commitWork(fiber.sibling);
}

function render(element, container) {
  // set nextUnitOfWork to the root of fiber tree
  wipRoot = {
    dom: container,
    props: {
      children: [element]
    },
    alternate: currentRoot,  // 将旧fiber tree 记录在 alternate里
  };
  nextUnitOfWork = wipRoot;
  deletions = [];
}

let nextUnitOfWork = null;
let wipRoot = null;  // 未渲染的根fiber
let currentRoot = null;  // 记录当前根fiber
let deletions = null;

// Concurrent Mode, 利用 requestIdleCallback 来实现浏览器空闲调度
// react 本身没有使用 requestIdleCallback，react 用的是 scheduler package
// https://github.com/facebook/react/tree/master/packages/scheduler
function workLoop(deadline) {
  while (nextUnitOfWork && deadline.timeRemaining() >= 1) {
    nextUnitOfWork = performUnitOfWork(
      nextUnitOfWork
    );
  }

  // 如果完成全部unit，并且存在 wipRoot，则渲染这个 fiber tree
  if (!nextUnitOfWork && wipRoot) {
    commitRoot();
  }

  requestIdleCallback(workLoop);
}

requestIdleCallback(workLoop);

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
    fiber.dom = createDom(fiber);
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

function reconcileChildren(wipFiber, elements) {
  let index = 0;
  let oldFiber = wipFiber.alternate?.child;
  let prevSibling = null;

  while (index < elements.length || oldFiber !== null) {
    const element = elements[index];
    let newFiber = null;

    // compare oldFiber to element
    const sameType = oldFiber && element && element.type === oldFiber.type;

    if (sameType) {
      // update the node
      newFiber = {
        type: oldFiber.type,
        props: element.props,
        dom: oldFiber.dom,
        parent: wipFiber,
        alternate: oldFiber,
        effectTag: 'UPDATE',
      };
    }

    if (element && !sameType) {
      // add this node
      newFiber = {
        type: element.type,
        props: element.props,
        dom: null,
        parent: wipFiber,
        alternate: null,
        effectTag: 'PLACEMENT',
      };
    }

    if (oldFiber && !sameType) {
      // delete the oldFiber's node
      oldFiber.effectTag = 'DELETION';
      deletions.push(oldFiber);
    }

    if (index === 0) {
      fiber.child = newFiber;
    } else {
      prevSibling.subling = newFiber;
    }

    prevSibling = newFiber;
    index++;
  }
}


export default {
  createElement,
  render,
};

