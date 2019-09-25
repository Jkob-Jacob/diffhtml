import { Internals, createTree } from 'diffhtml';
import { ComponentTreeCache, InstanceCache } from '../util/caches';
import { $$vTree } from '../util/symbols';

export default function renderComponent(vTree, context = {}) {
  const Component = vTree.rawNodeName;
  const props = vTree.attributes;
  const isNewable = Component.prototype && Component.prototype.render;

  let instance = null;
  let renderTree = null;

  if (InstanceCache.has(vTree)) {
    instance = InstanceCache.get(vTree);

    if (typeof instance.componentWillReceiveProps === 'function') {
      instance.componentWillReceiveProps(props);
    }

    // TODO Find a better way of accomplishing this...
    // Wipe out all old references before re-rendering.
    ComponentTreeCache.forEach((_vTree, childNode) => {
      if (_vTree === vTree) {
        ComponentTreeCache.delete(childNode);
      }
    });

    if (instance.shouldComponentUpdate()) {
      renderTree = createTree(instance.render(props, instance.state, context));

      if (instance.componentDidUpdate) {
        instance.componentDidUpdate(instance.props, instance.state);
      }
    }
  }
  // New class instance.
  else if (isNewable) {
    instance = new Component(props, context);
    InstanceCache.set(vTree, instance);
    instance[$$vTree] = vTree;

    renderTree = createTree(instance.render(props, instance.state, context));
  }
  else {
    renderTree = createTree(Component(props, context));
  }

  // Associate the children with the parent component that rendered them, this
  // is used to trigger lifecycle events.
  const linkTrees = childNodes => {
    for (let i = 0; i < childNodes.length; i++) {
      const newTree = childNodes[i];

      // If the newTree is not a Fragment, associate the `newTree` with the
      // originating `vTree`.
      if (newTree && newTree.nodeType !== 11) {
        ComponentTreeCache.set(newTree, vTree);
      }
      else if (newTree) {
        linkTrees(newTree.childNodes);
      }
    }
  };

  // Maybe this isn't necessary? For now it helps track, but this is costly
  // and perhaps can be solved in a different way.
  linkTrees([].concat(renderTree));

  if (renderTree && Component) {
    // Need to update the NodeCache now.
    ComponentTreeCache.set(renderTree, vTree);
  }

  return renderTree;
};
