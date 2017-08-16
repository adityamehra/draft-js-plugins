/* eslint-disable react/no-array-index-key */
import React from 'react';
import { getVisibleSelectionRect } from 'draft-js';

// TODO make toolbarHeight to be determined or a parameter
const toolbarHeight = 44;

const getRelativeParent = (element) => {
  if (!element) {
    return null;
  }

  const position = window.getComputedStyle(element).getPropertyValue('position');
  if (position !== 'static') {
    return element;
  }

  return getRelativeParent(element.parentElement);
};

export default class Toolbar extends React.Component {

  state = {
    isVisible: false,
    position: undefined,

    /**
     * If this is set, the toolbar will render this instead of the regular
     * structure and will also be shown when the editor loses focus.
     * @type {Component}
     */
    overrideContent: undefined
  }

  componentWillMount() {
    this.props.store.subscribeToItem('selection', this.onSelectionChanged);
  }

  componentWillUnmount() {
    this.props.store.unsubscribeFromItem('selection', this.onSelectionChanged);
  }

  /**
   * This can be called by a child in order to render custom content instead
   * of the regular structure. It's the responsibility of the callee to call
   * this function again with `undefined` in order to reset `overrideContent`.
   * @param {Component} overrideContent
   */
  onOverrideContent = (overrideContent) =>
    this.setState({ overrideContent });

  onSelectionChanged = () => {
    // need to wait a tick for window.getSelection() to be accurate
    // when focusing editor with already present selection
    setTimeout(() => {
      if (!this.toolbar) return;
      const relativeParent = getRelativeParent(this.toolbar.parentElement);
      const relativeRect = (relativeParent || document.body).getBoundingClientRect();
      const selectionRect = getVisibleSelectionRect(window);
      console.log(selectionRect);
      console.log("window.innerHeight " + window.innerHeight);
      console.log("window.innerWidth " + window.innerWidth);

      if (!selectionRect) return;

      let position = {};

      if(selectionRect.left < (0.05 * window.innerWidth)){
        console.log("1");
        position = {
          top: (selectionRect.top - relativeRect.top) - (0.5 * toolbarHeight),
          left: (selectionRect.left - relativeRect.left) + (0.04 * window.innerWidth)
        }
      }else if (selectionRect.left > (0.9 * window.innerWidth)){
        console.log("2");
        position = {
          top: (selectionRect.top - relativeRect.top) - (0.5 * toolbarHeight),
          left: (selectionRect.left - relativeRect.left) - (0.04 * window.innerWidth)
        }
      }else{
        console.log("3");
        position = {
          top: (selectionRect.top - relativeRect.top) - (0.5 * toolbarHeight),
          left: (selectionRect.left - relativeRect.left) + (selectionRect.width/2),
        }
      }

      /**
       * Original position -  
       *const position = {
       *  top: (selectionRect.top - relativeRect.top) - toolbarHeight,
       *  left: (selectionRect.left - relativeRect.left) + selectionRect.width + selectionRect.width,
       *};
       */

      console.log(position);
      
      this.setState({ position });
    });
  };

  getStyle() {
    const { store } = this.props;
    const { overrideContent, position } = this.state;
    const selection = store.getItem('getEditorState')().getSelection();
    const isVisible = (!selection.isCollapsed() || overrideContent) && selection.getHasFocus();
    const style = { ...position };

    if (isVisible) {
      style.visibility = 'visible';
      style.transform = 'translate(-50%) scale(1)';
      style.transition = 'transform 0.15s'; // cubic-bezier(.3,1.2,.2,1)
    } else {
      style.transform = 'translate(-50%) scale(0)';
      style.visibility = 'hidden';
    }

    return style;
  }

  handleToolbarRef = (node) => {
    this.toolbar = node;
  };

  render() {
    const { theme, store, structure } = this.props;
    const { overrideContent: OverrideContent } = this.state;
    const childrenProps = {
      theme: theme.buttonStyles,
      getEditorState: store.getItem('getEditorState'),
      setEditorState: store.getItem('setEditorState'),
      onOverrideContent: this.onOverrideContent
    };

    return (
      <div
        className={theme.toolbarStyles.toolbar}
        style={this.getStyle()}
        ref={this.handleToolbarRef}
      >
        {OverrideContent
          ? <OverrideContent {...childrenProps} />
          : structure.map((Component, index) =>
            <Component key={index} {...childrenProps} />)}
      </div>
    );
  }
}
