import {getFinishedFiberRoot, getWipFiber, setWipRoot} from './workLoop';

let hookIndex = 0;

export function resetHookIndex() {
  hookIndex = 0;
}

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

function render(element, container) {
  // set nextUnitOfWork to the root of fiber tree
  setWipRoot({
    dom: container,
    props: {
      children: [element]
    },
  });
}

function useState(initialState) {
  const wipFiber = getWipFiber();
  const oldHook = wipFiber.alternate && wipFiber.alternate.hooks && wipFiber.alternate.hooks[hookIndex];
  const hook = {
    state: oldHook ? oldHook.state : initialState,
    queue: [],
  };

  // 运行之前setState后加入到 hook.queue 里的 action。（setState 后加入， setState 会启动新的unitWork，会调用useState）
  const actions = oldHook ? oldHook.queue : [];
  actions.forEach(action => {
    hook.state = action instanceof Function ? action(hook.state) : action;
  });

  // setState 设置新的 wipRoot 和 nextUnitOfWork 来启动新的fiber渲染
  const setState = action => {
    hook.queue.push(action);
    setWipRoot({
      dom: getFinishedFiberRoot().dom,
      props: getFinishedFiberRoot().props,
      alternate: getFinishedFiberRoot()
    });
  };

  // 将 hook 数据记录在fiber的hooks属性里，以便下次调用setState的时候修改
  wipFiber.hooks.push(hook);
  hookIndex++;


  return [hook.state, setState];
}


export default {
  createElement,
  render,
  useState
};

