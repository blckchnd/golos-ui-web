import React from 'react';
import Icon from 'app/components/elements/Icon.jsx';
import { APP_NAME, APP_ICON } from 'app/client_config';

export default function MiniHeader() {
    return <header className="Header">
        <div className="Header__top header">
            <div className="expanded row align-middle">
                <div className="columns">
                    <ul className="menu">
                        <li className="Header__top-logo">
                            <a href="/"><Icon name={APP_ICON} size="2x" /></a>
                        </li>
                        <li className="Header__top-steemit show-for-medium"><a href="/">GOLOS<span className="beta">blockchain</span></a></li>
                    </ul>
                </div>
            </div>
        </div>
    </header>;
}
