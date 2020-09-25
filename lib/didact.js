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
  const $dom = fiber.type === 'TEXT_ELEMENT'
    ? document.createTextNode('')
    : document.createElement(fiber.type);

  // assign props to $dom
  const isProperty = key => key !== 'children';
  Object.keys(fiber.props)
    .filter(isProperty)
    .forEach(name => {
      $dom[name] = fiber.props[name];
    });

  return $dom;
}

function commitRoot() {
  commitWork(wipRoot);
  wipRoot = null;
}

// 递归渲染
function commitWork(fiber) {
  if (!fiber) {
    return;
  }
  const $domParent = fiber.parent.dom;
  $domParent.appendChild(fiber.dom);
  commitWork(fiber.child);
  commitWork(fiber.sibling);
}

function render(element, container) {
  // set nextUnitOfWork to the root of fiber tree
  wipRoot = {
    dom: container,
    props: {
      children: [element]
    }
  };
  nextUnitOfWork = wipRoot;
}

let nextUnitOfWork = null;
let wipRoot = null;

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

  if (fiber.parent) {
    fiber.parent.dom.appendChild(fiber.dom);
  }

  // create new fibers
  const elements = fiber.props.children;
  let index = 0;
  let prevSibling = null;

  while (index < elements.length) {
    const element = elements[index];

    const newFiber = {
      type: elements.type,
      props: element.props,
      parent: fiber,
      dom: null
    };

    if (index === 0) {
      fiber.child = newFiber;
    } else {
      prevSibling.subling = newFiber;
    }

    prevSibling = newFiber;
    index++;
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


export default {
  createElement,
  render,
};

