import React from 'react';
import { Tooltip, Badge } from 'react-components';
import PropTypes from 'prop-types';

const BadgeWithTooltip = ({ tooltip, title, type }) => (
    <Tooltip title={tooltip}>
        <Badge type={type}>{title}</Badge>
    </Tooltip>
);

BadgeWithTooltip.propTypes = {
    tooltip: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired
};

export default BadgeWithTooltip;
