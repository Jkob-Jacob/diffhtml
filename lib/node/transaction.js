import patchNode from './patch';
import makeTree from '../tree/make';
import syncTree from '../tree/sync';
import { createElement } from '../tree/helpers';
import { protectElement, unprotectElement } from '../util/memory';
import { parse } from '../util/parser';
import { pools } from '../util/pools';
import { completeRender } from '../util/render';
import { StateCache } from '../util/cache';

/**
 * If diffHTML is rendering anywhere asynchronously, we need to wait until it
 * completes before this render can be executed. This sets up the next buffer,
 * if necessary, which serves as a Boolean determination later to `bufferSet`.
 *
 * @param {Object} state - The current DOM Node state within diffHTML
 * @param {Object} nextRender - The respective arguments to set buffer
 * @return {Boolean} - Whether or not diffHTML is currently rendering
 */
const setBufferState = (state, nextRender) => {
  // Look up all existing states for any rendering, and set the next render
  // buffer if blocked.
  StateCache.forEach(_state => {
    // If we attach a nextRender, then the buffer has been set.
    if (_state.isRendering) {
      state.nextRender = nextRender;
    }
  });

  // Let outside code know if we were blocked.
  return Boolean(state.nextRender);
};

/**
 * Gets a Virtual Tree Element from the newHTML passed to a diff method.
 *
 * @param {String|Object} newHTML - HTML/DOM Node/Virtual Tree Element
 * @return {Object} - Virtual Tree Element
 */
const getTreeFromNewHTML = (newHTML, options, callback) => {
  // This is HTML Markup, so we need to parse it.
  if (typeof newHTML === 'string') {
    const childNodes = parse(newHTML).childNodes;

    // If we are dealing with innerHTML, use all the Nodes. If we're dealing
    // with outerHTML, we can only support diffing against a single element,
    // so pick the first one.
    return callback(childNodes);
  }
  // This is a DOM Node, so we need to convert to a vTree.
  else if (newHTML.ownerDocument) {
    const newTree = makeTree(newHTML);

    if (newTree.nodeType === 11) {
      pools.elementObject.unprotect(newTree);
      return callback(newTree.childNodes);
    }

    return callback(newTree);
  }

  // This is a Virtual Tree Element, or something like it, so we can just pass
  // it along.
  return callback(newHTML);
};

/**
 * Creates a sequential render transaction on a DOM Node. This requires
 * checking for a previous render first. Since diffHTML is globally connected
 * (hopefully only running one copy...), this will prevent transitions from
 * interferring.
 *
 * @param node
 * @param newHTML
 * @param options
 */
export default function createTransaction(node, newHTML, options) {
  // Used to associate state with the currently rendering node. This
  // prevents attaching properties to the instance itself.
  const state = StateCache.get(node) || {};
  const isInner = options.inner;
  const previousMarkup = state.previousMarkup;
  const previousText = state.previousText;
  const bufferSet = setBufferState(state, { node, newHTML, options });

  // Associate the current render options with the DOM Node state.
  state.options = options;

  // Always ensure the most up-to-date state object is stored.
  StateCache.set(node, state);

  // Short circuit the rest of this render if we ended up having to set a
  // buffer. This happens when some other code using diffHTML is rendering
  // asynchronously (using transitions w/ Promise).
  if (bufferSet) { return; }

  // This looks for changes in the DOM from what we'd expect. This means we
  // need to rebuild the old Virtual Tree. This allows for keeping our tree in
  // sync with unexpected DOM changes. It's not very performant, so ideally you
  // should never change markup that diffHTML affects from outside of diffHTML
  // if performance is a concern.
  const sameInnerHTML = isInner ? previousMarkup === node.innerHTML : true;
  const sameOuterHTML = !isInner ? previousMarkup === node.outerHTML : true;
  const sameTextContent = previousText === node.textContent;

  // If the contents haven't changed, abort, since there is no point in
  // continuing. Only support this if the new markup is a string, otherwise
  // it's possible for our object recycling to match twice.
  if (typeof newHTML === 'string' && state.newHTML === newHTML) {
    return;
  }
  // Associate the last markup rendered with this node.
  else if (typeof newHTML === 'string') {
    state.newHTML = newHTML;
  }

  const rebuildTree = () => {
    const oldTree = state.oldTree;

    if (oldTree) {
      unprotectElement(oldTree);
    }

    state.oldTree = protectElement(makeTree(node));
  };

  if (!sameInnerHTML || !sameOuterHTML || !sameTextContent) {
    rebuildTree();
  }

  // We're rendering in the UI thread.
  state.isRendering = true;

  // We need to ensure that our target to diff is a Virtual Tree Element. This
  // function takes in whatever `newHTML` is and normalizes to a tree object.
  // The callback function runs on every normalized Node to wrap childNodes
  // in the case of setting innerHTML.
  const newTree = getTreeFromNewHTML(newHTML, options, newTree => {
    if (isInner) {
      pools.elementObject.unprotect(newTree);

      const nodeName = state.oldTree.nodeName;
      const attributes = state.oldTree.attributes;

      return createElement(nodeName, attributes, newTree);
    }

    return Array.isArray(newTree) ? newTree[0] : newTree;
  });

  // Synchronize the tree.
  const patches = syncTree(state.oldTree, newTree);
  const promises = patchNode(node, patches);
  const invokeRender = completeRender(node, state);

  // Operate synchronously unless opted into a Promise-chain. Doesn't matter if
  // they are actually Promises or not, since they will all resolve eventually
  // with `Promise.all`.
  if (promises.length) {
    Promise.all(promises).then(invokeRender, ex => console.log(ex));
  }
  else {
    invokeRender();
  }
}