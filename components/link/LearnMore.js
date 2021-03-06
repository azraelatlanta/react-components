import React from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';

import Href from './Href';

const LearnMore = ({ url, className }) => <Href url={url} className={className}>{c('Link').t`Learn more`}</Href>;

LearnMore.propTypes = {
    url: PropTypes.string.isRequired,
    className: PropTypes.string
};

export default LearnMore;
