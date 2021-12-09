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

  Object.keys(fiber.props).filter(key => key !== "children").forEach(name => {
    dom[name] = fiber.props[name];
  });
  return dom;
}

function commitRoot() {
  deletions.forEach(commitWork);
  commitWork(wipRoot.child);
  currentRoot = wipRoot;
  wipRoot = null;
}

function commitWork(fiber) {
  if (!fiber) {
    return;
  }

  const domParent = fiber.parent.dom;

  if (fiber.effectTag === "PLACEMENT" && fiber.dom !== null) {
    domParent.appendChild(fiber.dom);
  } else if (fiber.effectTag === "DELETION") {
    domParent.removeChild(fiber.dom);
  } else if (fiber.effectTag === "UPDATE" && fiber.dom !== null) {
    updateDom(fiber.dom, fiber.alternate.props, fiber.props);
  }

  domParent.appendChild(fiber.dom);
  commitWork(fiber.child);
  commitWork(fiber.sibling);
}

const isEvent = key => key.startsWith("on");

const isProperty = key => key !== 'children'; // const isNew = (prev, next) => key => prev(key) !== next[key]
// const isGone = (prev, next) => key => !(key in next)


function updateDom(dom, prevProps, nextProps) {
  // 删除 Event
  Object.keys(prevProps).filter(isEvent).filter(key => !(key in nextProps) || prevProps[key] !== nextProps[key]).forEach(name => {
    const eventType = name.toLowerCase().substring(2);
    dom.removeEventListener(eventType, prevProps[name]);
  }); // 添加Event

  Object.keys(nextProps).filter(isEvent).filter(key => prevProps[key] !== nextProps[key]).forEach(name => {
    const eventType = name.toLowerCase().substring(2);
    dom.addEventListener(eventType, prevProps[name]);
  }); // 删除旧的

  Object.keys(prevProps).filter(isProperty).filter(key => !(key in nextProps)).forEach(name => {
    dom[name] = '';
  }); // 设置新的属性

  Object.keys(nextProps).filter(isProperty).filter(key => prevProps[key] !== nextProps[key]).forEach(name => {
    dom[name] = nextProps[name];
  });
}

function render(element, container) {
  wipRoot = {
    dom: container,
    props: {
      children: [element]
    },
    alternate: currentRoot
  };
  deletions = [];
  nextUnitWOfWork = wipRoot;
} // 需要执行的任务


let nextUnitWOfWork = null; // 已经提交渲染完成的root fiber

let currentRoot = null;
let wipRoot = null; // 需要删除的 fiber

let deletions = []; // 执行任务的循环 每一次调用的时候设置 执行时间

function workLoop(deadline) {
  let shouldYield = false;

  while (nextUnitWOfWork && !shouldYield) {
    nextUnitWOfWork = performUnitOfWork(nextUnitWOfWork);
    shouldYield = deadline.timeRemaining() < 1;
  } // 如果没有后续的任务了 提交


  if (!nextUnitWOfWork && wipRoot) {
    commitRoot();
  }

  requestIdleCallback(workLoop);
} // 在主线程空闲的时候 回调我们传入的方法


requestIdleCallback(workLoop); // 执行一个任务 并且返回后续需要执行的任务

function performUnitOfWork(fiber) {
  //1. 如果 fiber dom 不存在，则创建HTML node
  if (!fiber.dom) {
    fiber.dom = createDom(fiber);
  } //2. 如果其有 parent，需要将其添加到父节点
  // if (fiber.parent) {
  //   fiber.parent.dom.appendChild(fiber.dom)
  // }
  //3. 创建新的fibers


  const elements = fiber.props.children; // 将会抽取成单独的方法 --------------------start------------
  // reconcileChildren(fiber, elements)

  const wipFiber = fiber;
  let index = 0;
  let oldFiber = wipFiber.alternate && wipFiber.alternate.child;
  let prevSibling = null; // 构建当前fiber 和其子 fiber 的关系

  while (index < elements.length || oldFiber != null) {
    const element = elements[index];
    let newFiber = null;
    const sameType = oldFiber && element && element.type === oldFiber.type; // 如果类型相同只需要更新props

    if (sameType) {
      newFiber = {
        type: oldFiber.type,
        props: element.props,
        dom: oldFiber.dom,
        parent: wipFiber,
        alternate: oldFiber,
        effectTag: "UPDATE" //标注需要更新props

      };
    } // 添加这个node


    if (element && !sameType) {
      newFiber = {
        type: element.type,
        props: element.props,
        dom: null,
        parent: wipFiber,
        alternate: null,
        effectTag: "PLACEMENT"
      };
    } // 删除 old fiber node


    if (oldFiber && !sameType) {
      oldFiber.effectTag = "DELETION";
      deletions.push(oldFiber);
    } // 将根据children创建的第一个fiber，设置为当前fiber的child


    if (index == 0) {
      wipFiber.child = newFiber;
    } else {
      // 将 new fiber 设置为上一个fiber 的 sibling
      prevSibling.sibling = newFiber;
    }

    prevSibling = newFiber;
    index++;
  } // 将会抽取成单独的方法 --------------------end------------
  // 4. 返回后续需要执行的任务


  if (fiber.child) {
    return fiber.child;
  }

  let nextFiber = fiber; // 寻找当前fiber及其父fiber路径上面的姊妹fiber，当运行到这里的时候，一定是到达了root到该fiber路径的叶子fiber

  while (nextFiber) {
    if (nextFiber.sibling) {
      return nextFiber.sibling;
    }

    nextFiber = nextFiber.parent;
  }
}

function reconcileChildren(wipFiber, elements) {
  let index = 0;
  let oldFiber = wipFiber.alternate && wipFiber.alternate.child;
  let prevSibling = null; // 构建当前fiber 和其子 fiber 的关系

  while (index < elements.length || oldFiber != null) {
    const element = elements[index];
    let newFiber = null;
    const sameType = oldFiber && element && element.type === oldFiber.type; // 如果类型相同只需要更新props

    if (sameType) {
      newFiber = {
        type: oldFiber.type,
        props: element.props,
        dom: oldFiber.dom,
        parent: wipFiber,
        alternate: oldFiber,
        effectTag: "UPDATE" //标注需要更新props

      };
    } // 添加这个node


    if (element && !sameType) {
      newFiber = {
        type: element.type,
        props: element.props,
        dom: null,
        parent: wipFiber,
        alternate: null,
        effectTag: "PLACEMENT"
      };
    } // 删除 old fiber node


    if (oldFiber && !sameType) {
      oldFiber.effectTag = "DELETION";
      deletions.push(oldFiber);
    } // 将根据children创建的第一个fiber，设置为当前fiber的child


    if (index == 0) {
      wipFiber.child = newFiber;
    } else {
      // 将 new fiber 设置为上一个fiber 的 sibling
      prevSibling.sibling = newFiber;
    }

    prevSibling = newFiber;
    index++;
  }
}

const Didact = {
  createElement,
  render
};

function NameText(props) {
  return Didact.createElement("h1", null, "H1");
}
/** @jsx Didact.createElement */


const element = Didact.createElement("div", {
  id: "foo",
  className: "title"
}, Didact.createElement("a", null, "bar"), Didact.createElement("b", null), Didact.createElement(NameText, null));
const container = document.getElementById("root");
Didact.render(element, container);