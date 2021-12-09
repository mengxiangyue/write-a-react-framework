/** @jsxRuntime classic */
import './index.css'; // 返回数据模型

function createElement(type, props, ...children) {
  return {
    type,
    props: { ...props,
      children: children.map(child => typeof child === 'object' ? child : createTextElement(child))
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
  // 根据配置创建 HTML node, 如果 type 是 TEXT_ELEMENT 需要特殊处理
  const dom = fiber.type === "TEXT_ELEMENT" ? document.createTextNode("") : document.createElement(fiber.type); // 获取除 children 以外的所有的属性，并将其赋值给新创建的 HTML node

  Object.keys(element.props).filter(key => key !== "children").forEach(name => {
    dom[name] = element.props[name];
  });
  return dom;
}

function render(element, container) {
  nextUnitWOfWork = {
    dom: container,
    props: {
      children: [element]
    }
  };
} // 需要执行的任务


let nextUnitWOfWork = null; // 执行任务的循环 每一次调用的时候设置 执行时间

function workLoop(deadline) {
  let shouldYield = false;

  while (nextUnitWOfWork && !shouldYield) {
    nextUnitWOfWork = performUnitOfWork(nextUnitWOfWork);
    shouldYield = deadline.timeRemaining() < 1;
  }

  requestIdleCallback(workLoop);
} // 在主线程空闲的时候 回调我们传入的方法


requestIdleCallback(workLoop); // 执行一个任务 并且返回后续需要执行的任务

function performUnitOfWork(fiber) {
  //1. 如果 fiber dom 不存在，则创建HTML node
  if (!fiber.dom) {
    fiber.dom = createDom(fiber);
  } //2. 如果其有 parent，需要将其添加到父节点


  if (fiber.parent) {
    fiber.parent.dom.appendChild(fiber.dom);
  } //3. 创建新的fibers


  const elements = fiber.props.children;
  let index = 0;
  let prevSibling = null;

  while (index < elements.length) {
    const element = elements[index];
    const newFiber = {
      type: element.type,
      props: element.props,
      parent: fiber,
      dom: null
    }; // 将根据children创建的第一个fiber，设置为当前fiber的child

    if (index == 0) {
      fiber.child = newFiber;
    } else {
      // 将 new fiber 设置为上一个fiber 的 sibling
      prevSibling.sibling = newFiber;
    }

    prevSibling = newFiber;
    index++;
  } // 4. 返回后续需要执行的任务


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

const Didact = {
  createElement,
  render
};
/** @jsx Didact.createElement */

const element = Didact.createElement("div", {
  id: "foo",
  className: "title"
}, Didact.createElement("a", null, "bar"), Didact.createElement("b", null));
const container = document.getElementById("root");
Didact.render(element, container);