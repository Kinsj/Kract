export const isEvent = key => key.startsWith('on');
export const isProperty = key =>
  key !== 'children' && !isEvent(key);
export const isNew = (prev, next) => key =>
  prev[key] !== next[key];
export const isGone = (prev, next) => key => !(key in next);

const bindEventFromProps = (dom, props) => {
  return name => {
    const eventType = name
      .toLowerCase()
      .substring(2);
    dom.addEventListener(
      eventType,
      props[name]
    );
  };
};

const unbindEventFromProps = (dom, props) => {
  return name => {
    const eventType = name
      .toLowerCase()
      .substring(2);
    dom.removeEventListener(
      eventType,
      props[name]
    );
  };
};

const updateEvents = (dom, prevProps, nextProps) => {
  // 移除已被更改的eventListener
  Object.keys(prevProps)
    .filter(isEvent)
    .filter(
      key =>
        !(key in nextProps) ||
        isNew(prevProps, nextProps)(key)
    )
    .forEach(unbindEventFromProps(dom, prevProps));

  // 绑定新增或更新的事件
  Object.keys(nextProps)
    .filter(isEvent)
    .filter(isNew(prevProps, nextProps))
    .forEach(bindEventFromProps(dom, nextProps));
};


export function createDom(fiber) {
  const dom = fiber.type === 'TEXT_ELEMENT'
    ? document.createTextNode('')
    : document.createElement(fiber.type);

  // 添加属性到dom
  Object.keys(fiber.props)
    .filter(isProperty)
    .forEach(name => {
      dom[name] = fiber.props[name];
    });

  // 添加事件监听到dom
  updateEvents(dom, {}, fiber.props);

  return dom;
}


export function updateDom(dom, prevProps, nextProps) {


  // 移除已被更改的属性
  Object.keys(prevProps)
    .filter(isProperty)
    .filter(isGone(prevProps, nextProps))
    .forEach(name => {
      dom[name] = '';
    });

  // 设置新增或更新的属性
  Object.keys(nextProps)
    .filter(isProperty)
    .filter(isNew(prevProps, nextProps))
    .forEach(name => {
      dom[name] = nextProps[name];
    });

  // 移除旧事件，绑定新事件
  updateEvents(dom, prevProps, nextProps);
}