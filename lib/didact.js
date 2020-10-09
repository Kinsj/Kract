import {setWipRoot} from './workLoop';

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

export default {
  createElement,
  render,
};

