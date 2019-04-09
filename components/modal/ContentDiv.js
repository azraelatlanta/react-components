import React from 'react';
import PropTypes from 'prop-types';

const ContentDiv = ({ children, className, ...rest }) => {
    return (
        <div className={`pm-modalContent ${className}`} {...rest}>
            {children}
        </div>
    );
};

ContentDiv.propTypes = {
    children: PropTypes.node.isRequired,
    className: PropTypes.string
};

ContentDiv.defaultProps = {
    className: ''
};

export default ContentDiv;
