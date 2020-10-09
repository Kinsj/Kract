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

export default createDom;