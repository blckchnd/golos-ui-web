import React from 'react';
import PropTypes from 'prop-types'
import { key_utils } from 'golos-classic-js/lib/auth/ecc';
import tt from 'counterpart';
import { APP_NAME_UP, TERMS_OF_SERVICE_URL } from 'app/client_config';

function allChecked(confirmCheckboxes) {
    return confirmCheckboxes.box1 && confirmCheckboxes.box2;
}

export default class GeneratedPasswordInput extends React.Component {

    static propTypes = {
        disabled: PropTypes.bool,
        onChange: PropTypes.func.isRequired,
        showPasswordString: PropTypes.bool.isRequired
    };

    state = {
        generatedPassword: 'P' + key_utils.get_random_key().toWif(),
        confirmPassword: '',
        confirmPasswordError: '',
        confirmCheckboxes: {box1: false, box2: false},
        showRules: false,
    };

    confirmCheckChange = e => {
        const confirmCheckboxes = this.state.confirmCheckboxes;
        confirmCheckboxes[e.target.name] = e.target.checked;
        this.setState({confirmCheckboxes});
        const {confirmPassword, generatedPassword} = this.state;
        this.props.onChange(confirmPassword, confirmPassword && confirmPassword === generatedPassword, allChecked(confirmCheckboxes));
    };

    confirmPasswordChange = e => {
        const confirmPassword = e.target.value.trim();
        const {generatedPassword, confirmCheckboxes} = this.state;
        let confirmPasswordError = '';
        if (confirmPassword && confirmPassword !== generatedPassword) confirmPasswordError = tt('g.passwords_do_not_match');
        this.setState({confirmPassword, confirmPasswordError});
        this.props.onChange(confirmPassword, confirmPassword && confirmPassword === generatedPassword, allChecked(confirmCheckboxes));
    };

    render() {
        const {disabled, showPasswordString} = this.props;
        const {generatedPassword, confirmPassword, confirmPasswordError, confirmCheckboxes} = this.state;
        return (
            <div className="GeneratedPasswordInput">
                <div className="GeneratedPasswordInput__field">
                    <label className="uppercase">
                        {tt('createaccount_jsx.take_your_secret_key')}
                        <br />
                        <code className={(disabled ? 'disabled ' : '') + 'GeneratedPasswordInput__generated_password'}>{showPasswordString ? generatedPassword : '-'}</code>
                        <div className="GeneratedPasswordInput__backup_text">
                            {tt('g.backup_password_by_storing_it')}
                        </div>
                    </label>
                </div>
                <div className="GeneratedPasswordInput__field">
                    <label className="uppercase">
                        {tt('g.re_enter_generate_password')}
                        <input type="password" name="confirmPassword" autoComplete="off" onChange={this.confirmPasswordChange} value={confirmPassword} disabled={disabled} />
                    </label>
                    <div className="error">{confirmPasswordError}</div>
                </div>
                {this._renderPasswordRules()}
                <div className="GeneratedPasswordInput__confirm">
                    {tt('createaccount_jsx.final_confirm')}
                </div>
                <div className="GeneratedPasswordInput__checkboxes">
                    <label><input type="checkbox" name="box1" onChange={this.confirmCheckChange} checked={confirmCheckboxes.box1} disabled={disabled} />
                        {tt('g.understand_that_APP_NAME_cannot_recover_password', {APP_NAME: APP_NAME_UP})}.
                    </label>
                    <label><input type="checkbox" name="box2" onChange={this.confirmCheckChange} checked={confirmCheckboxes.box2} disabled={disabled} />
                        {tt('g.i_saved_password')}.
                    </label>
                </div>
            </div>
        );
    }

    _renderPasswordRules() {
        if (this.state.showRules) {
            const APP_NAME = tt('g.APP_NAME');

            return (
                <div>
                    <p className="GeneratedPasswordInput__rule">
                        {tt('g.the_rules_of_APP_NAME.one', { APP_NAME })}
                        <br />
                        {tt('g.the_rules_of_APP_NAME.second', { APP_NAME })}
                        <br />
                        {tt('g.the_rules_of_APP_NAME.third', { APP_NAME })}
                        <br />
                        {tt('g.the_rules_of_APP_NAME.fourth')}
                        <br />
                        {tt('g.the_rules_of_APP_NAME.fifth')}
                        <br />
                        {tt('g.the_rules_of_APP_NAME.sixth')}
                        <br />
                        {tt('g.the_rules_of_APP_NAME.seventh')}
                    </p>
                    <div className="text-left">
                        <a
                            className="GeneratedPasswordInput__rules-button"
                            href="#"
                            onClick={this._onToggleRulesClick}
                        >
                            {tt('g.close')}&nbsp;&uarr;
                        </a>
                    </div>
                    <hr />
                </div>
            );
        } else {
            return (
                <p>
                    <a
                        className="GeneratedPasswordInput__rules-button"
                        href="#"
                        onClick={this._onToggleRulesClick}
                    >
                        {tt('g.show_rules')}&nbsp;&darr;
                    </a>
                </p>
            );
        }
    }

    _onToggleRulesClick = e => {
        e.preventDefault();
        this.setState({ showRules: !this.state.showRules });
    };
}
