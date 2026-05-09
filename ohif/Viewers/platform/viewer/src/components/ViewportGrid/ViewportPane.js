import React, { useRef, useEffect, useCallback } from 'react';
import { useDrop } from 'react-dnd';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import './ViewportPane.css';

const ViewportPane = function (props) {
  const { children, onDrop, viewportIndex, className: propClassName, isActive } = props;
  const paneRef = useRef(null);

  const [{ hovered, highlighted }, drop] = useDrop({
    accept: 'thumbnail',
    drop: (droppedItem, monitor) => {
      const canDrop = monitor.canDrop();
      const isOver = monitor.isOver();

      if (canDrop && isOver && onDrop) {
        const { StudyInstanceUID, displaySetInstanceUID } = droppedItem;

        onDrop({ viewportIndex, StudyInstanceUID, displaySetInstanceUID });
      }
    },
    // Monitor, and collect props.
    // Returned as values by `useDrop`
    collect: monitor => ({
      highlighted: monitor.canDrop(),
      hovered: monitor.isOver(),
    }),
  });

  // Combine react-dnd drop ref with our own ref
  const setRefs = useCallback((node) => {
    paneRef.current = node;
    drop(node);
  }, [drop]);

  // Attach native click/touch listener directly to DOM to bypass cornerstone interception
  useEffect(() => {
    const el = paneRef.current;
    if (!el) return;

    const activateViewport = (e) => {
      // Don't activate if already active (avoids re-triggering)
      if (isActive) return;

      if (window.store) {
        window.store.dispatch({
          type: 'SET_VIEWPORT_ACTIVE',
          viewportIndex,
        });
      }
    };

    // Use capture phase to intercept before cornerstone tools
    el.addEventListener('click', activateViewport, true);
    el.addEventListener('touchend', activateViewport, true);

    return () => {
      el.removeEventListener('click', activateViewport, true);
      el.removeEventListener('touchend', activateViewport, true);
    };
  }, [isActive, viewportIndex]);

  return (
    <div
      className={classNames(
        'viewport-drop-target',
        { hovered: hovered },
        { highlighted: highlighted },
        propClassName
      )}
      ref={setRefs}
      data-cy={`viewport-container-${viewportIndex}`}
    >
      {children}
    </div>
  );
};

ViewportPane.propTypes = {
  children: PropTypes.node.isRequired,
  viewportIndex: PropTypes.number.isRequired,
  onDrop: PropTypes.func.isRequired,
  isActive: PropTypes.bool,
  className: PropTypes.string,
};

/**
 * Custom memo comparator — only re-render if layout-critical props change.
 * Skips re-renders triggered by unrelated Redux state changes.
 */
function viewportPanePropsEqual(prevProps, nextProps) {
  return (
    prevProps.viewportIndex === nextProps.viewportIndex &&
    prevProps.isActive === nextProps.isActive &&
    prevProps.className === nextProps.className &&
    prevProps.onDrop === nextProps.onDrop
  );
}

export default React.memo(ViewportPane, viewportPanePropsEqual);
