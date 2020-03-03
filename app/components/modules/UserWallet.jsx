import React from 'react';
import {connect} from 'react-redux';
import {Link} from 'react-router';
import g from 'app/redux/GlobalReducer';
import SavingsWithdrawHistory from 'app/components/elements/SavingsWithdrawHistory';
import TransferHistoryRow from 'app/components/cards/TransferHistoryRow';
import TransactionError from 'app/components/elements/TransactionError';
import TimeAgoWrapper from 'app/components/elements/TimeAgoWrapper';
import Reveal from 'react-foundation-components/lib/global/reveal';
import CloseButton from 'react-foundation-components/lib/global/close-button';
import {numberWithCommas, vestsToSteem} from 'app/utils/StateFunctions';
import FoundationDropdownMenu from 'app/components/elements/FoundationDropdownMenu';
import WalletSubMenu from 'app/components/elements/WalletSubMenu';
import shouldComponentUpdate from 'app/utils/shouldComponentUpdate';
import Tooltip from 'app/components/elements/Tooltip';
import Icon from 'app/components/elements/Icon';
import tt from 'counterpart';
import {List} from 'immutable';
import LocalizedCurrency from 'app/components/elements/LocalizedCurrency';
import { LIQUID_TICKER, VEST_TICKER, DEBT_TICKER} from 'app/client_config';

const assetPrecision = 1000;

class UserWallet extends React.Component {
    
    constructor() {
        super();
        this.state = {};
        this.shouldComponentUpdate = shouldComponentUpdate(this, 'UserWallet');
    }

    render() {
        const LIQUID_TOKEN = tt('token_names.LIQUID_TOKEN')
        const LIQUID_TOKEN_UPPERCASE = tt('token_names.LIQUID_TOKEN_UPPERCASE')
        const DEBT_TOKEN = tt('token_names.DEBT_TOKEN')
        const DEBT_TOKENS = tt('token_names.DEBT_TOKENS')
        const VESTING_TOKEN =  tt('token_names.VESTING_TOKEN')
        const VESTING_TOKEN2 = tt('token_names.VESTING_TOKEN2')
        const VESTING_TOKENS = tt('token_names.VESTING_TOKENS')
        const TOKEN_WORTH = tt('token_names.TOKEN_WORTH')

        const {showDeposit, depositType, toggleDivestError} = this.state
        const {convertToSteem, price_per_golos, savings_withdraws, account, current_user, open_orders} = this.props
        const gprops = this.props.gprops.toJS();

        if (!account) return null;
        const vesting_steem = vestsToSteem(account.get('vesting_shares'), gprops);
        const received_vesting_shares = vestsToSteem(account.get('received_vesting_shares'), gprops);
        const delegated_vesting_shares = vestsToSteem(account.get('delegated_vesting_shares'), gprops);

        let isMyAccount = current_user && current_user.get('username') === account.get('name');

        const disabledWarning = false;
        // isMyAccount = false; // false to hide wallet transactions

        const showTransfer = (asset, transferType, e) => {
            e.preventDefault();
            this.props.showTransfer({
                to: (isMyAccount ? null : account.get('name')),
                asset, transferType
            });
        };

        const savings_balance = account.get('savings_balance');
        const savings_sbd_balance = account.get('savings_sbd_balance');

        const powerDown = (cancel, e) => {
            e.preventDefault()
            const name = account.get('name');
            if (cancel) {
                const vesting_shares = cancel
                    ? '0.000000 GESTS'
                    : account.get('vesting_shares');
                this.setState({toggleDivestError: null});
                const errorCallback = e2 => {
                    this.setState({ toggleDivestError: e2.toString() })
                };
                const successCallback = () => {
                    this.setState({ toggleDivestError: null })
                }
                this.props.withdrawVesting({
                    account: name,
                    vesting_shares,
                    errorCallback,
                    successCallback
                })
            } else {
                const to_withdraw = account.get('to_withdraw');
                const withdrawn = account.get('withdrawn');
                const vesting_shares = account.get('vesting_shares');
                const delegated_vesting_shares = account.get(
                    'delegated_vesting_shares'
                );
                this.props.showPowerdown({
                    account: name,
                    to_withdraw,
                    withdrawn,
                    vesting_shares,
                    delegated_vesting_shares,
                });
            }
        }

        const showDelegateVesting = (e) => {
            e.preventDefault()
            const name = account.get('name')
            this.props.delegateVesting(name)
        }

        const showDelegateVestingInfo = (type, e) => {
            e.preventDefault()
            const name = account.get('name')
            this.props.showDelegatedVesting(name, type)
        }

        // Sum savings withrawals
        let savings_pending = 0, savings_sbd_pending = 0;
        if(savings_withdraws) {
            savings_withdraws.forEach(withdraw => {
                const [amount, asset] = withdraw.get('amount').split(' ');
                if(asset === LIQUID_TICKER)
                    savings_pending += parseFloat(amount);
                else {
                    if(asset === DEBT_TICKER)
                        savings_sbd_pending += parseFloat(amount)
                }
            })
        }

        // Sum conversions
        let conversionValue = 0;
        const currentTime = (new Date()).getTime();
        const conversions = account.get('other_history', List()).reduce( (out, item) => {
            if(item.getIn([1, 'op', 0], "") !== 'convert') return out;

            const timestamp = new Date(item.getIn([1, 'timestamp'])).getTime();
            const finishTime = timestamp + (86400000 * 3.5); // add 3.5day conversion delay
            // const finishTime = timestamp + (86400000 * (timestamp <= 1481040000000 ? 7 : 3.5)); // add conversion delay before/after hardfork change
            if(finishTime < currentTime) return out;

            const amount = parseFloat(item.getIn([1, 'op', 1, 'amount']).replace(' ' + DEBT_TICKER, ''));
            conversionValue += amount;

            return out.concat([
                <div key={item.get(0)}>
                    <Tooltip t={tt('userwallet_jsx.conversion_complete_tip') + ": " + new Date(finishTime).toLocaleString()}>
                        <span>(+{tt('userwallet_jsx.in_conversion', {amount: numberWithCommas(amount.toFixed(3)) + ' ' + DEBT_TICKER})})</span>
                    </Tooltip>
                </div>
            ]);
        }, [])

        const balance_steem = parseFloat(account.get('balance').split(' ')[0]);
        const saving_balance_steem = parseFloat(savings_balance.split(' ')[0]);
        const divesting = parseFloat(account.get('vesting_withdraw_rate').split(' ')[0]) > 0.000000;
        const sbd_balance = parseFloat(account.get('sbd_balance'))
        const sbd_balance_savings = parseFloat(savings_sbd_balance.split(' ')[0]);
        const sbdOrders = (!open_orders || !isMyAccount) ? 0 : open_orders.reduce((o, order) => {
            if (order.sell_price.base.indexOf(DEBT_TICKER) !== -1) {
                o += order.for_sale;
            }
            return o;
        }, 0) / assetPrecision;

        const steemOrders = (!open_orders || !isMyAccount) ? 0 : open_orders.reduce((o, order) => {
            if (order.sell_price.base.indexOf(LIQUID_TICKER) !== -1) {
                o += order.for_sale;
            }
            return o;
        }, 0) / assetPrecision;

        // set displayed estimated value
        const total_sbd = sbd_balance + sbd_balance_savings + savings_sbd_pending + sbdOrders + conversionValue;
        const total_steem = parseFloat(vesting_steem) + balance_steem + saving_balance_steem + savings_pending + steemOrders;

        // set displayed estimated value
        const total_value = Number(((total_steem * price_per_golos) + total_sbd).toFixed(2))

        // format spacing on estimated value based on account state
        const estimate_output = <LocalizedCurrency amount={total_value} />
        
        /// transfer log
        let idx = 0
        const transfer_log = account.get('transfer_history', [])
        .map(item => {
            const data = item.getIn([1, 'op', 1]);
            const type = item.getIn([1, 'op', 0]);
            
            // Filter out rewards
            if (type === "curation_reward" || type === "author_reward") return null;
            
            if(data.sbd_payout === '0.000 GBG' && data.vesting_payout === '0.000000 GESTS') return null

            return <TransferHistoryRow key={idx++} op={item.toJS()} context={account.get('name')} />;
        }).filter(el => !!el).reverse();

        let steem_menu = [
            { value: tt('g.transfer'), link: '#', onClick: showTransfer.bind( this, LIQUID_TICKER, 'Transfer to Account' ) },
            { value: tt('userwallet_jsx.transfer_to_savings'), link: '#', onClick: showTransfer.bind( this, LIQUID_TICKER, 'Transfer to Savings' ) },
            { value: tt('userwallet_jsx.power_up'), link: '#', onClick: showTransfer.bind( this, VEST_TICKER, 'Transfer to Account' ) },
        ]
        let power_menu = [
            { value: tt('userwallet_jsx.power_down'), link: '#', onClick: powerDown.bind(this, false) },
            { value: tt('delegatevestingshares_jsx.form_title', {VESTING_TOKEN2}), link:'#', onClick: showDelegateVesting.bind(this) }
        ]

        if( divesting ) {
            power_menu.pop()
            power_menu.push( { value: tt('userwallet_jsx.cancel_power_down'), link:'#', onClick: powerDown.bind(this,true) } );
        }

        if(isMyAccount) {
            steem_menu.push({ value: tt('g.buy_or_sell'), link: '/market' })
        }

        let dollar_menu = [
            { value: tt('g.transfer'), link: '#', onClick: showTransfer.bind( this, DEBT_TICKER, 'Transfer to Account' ) },
            { value: tt('userwallet_jsx.transfer_to_savings'), link: '#', onClick: showTransfer.bind( this, DEBT_TICKER, 'Transfer to Savings' ) },
            { value: tt('g.buy_or_sell'), link: '/market' },
            { value: tt('userwallet_jsx.convert_to_LIQUID_TOKEN', {LIQUID_TOKEN}), link: '#', onClick: convertToSteem },
        ]
        const isWithdrawScheduled = new Date(account.get('next_vesting_withdrawal') + 'Z').getTime() > Date.now()

        const steem_balance_str = numberWithCommas(balance_steem.toFixed(3)) + ' ' + LIQUID_TOKEN_UPPERCASE;
        const steem_orders_balance_str = numberWithCommas(steemOrders.toFixed(3)) + ' ' + LIQUID_TOKEN_UPPERCASE;
        const power_balance_str = numberWithCommas(vesting_steem) + ' ' + LIQUID_TOKEN_UPPERCASE;
        const savings_balance_str = numberWithCommas(saving_balance_steem.toFixed(3)) + ' ' + LIQUID_TOKEN_UPPERCASE;
        const sbd_balance_str = numberWithCommas(sbd_balance.toFixed(3)) + ' ' + DEBT_TICKER;
        const sbd_orders_balance_str = numberWithCommas(sbdOrders.toFixed(3)) + ' ' + DEBT_TICKER;
        const savings_sbd_balance_str = numberWithCommas(sbd_balance_savings.toFixed(3)) + ' ' + DEBT_TICKER;
        const received_vesting_shares_str = `${numberWithCommas(received_vesting_shares)} ${LIQUID_TICKER}`;
        const delegated_vesting_shares_str = `${numberWithCommas(delegated_vesting_shares)} ${LIQUID_TICKER}`;

        const steemTip = tt('tips_js.tradeable_tokens_that_may_be_transferred_anywhere_at_anytime') + ' ' + tt('tips_js.LIQUID_TOKEN_can_be_converted_to_VESTING_TOKEN_in_a_process_called_powering_up', {LIQUID_TOKEN, VESTING_TOKEN2, VESTING_TOKENS});
        const powerTip = tt('tips_js.influence_tokens_which_give_you_more_control_over', {VESTING_TOKEN, VESTING_TOKENS});

        const savings_menu = [
            { value: tt('userwallet_jsx.withdraw_LIQUID_TOKEN', {LIQUID_TOKEN}), link: '#', onClick: showTransfer.bind( this, LIQUID_TICKER, 'Savings Withdraw' ) },
        ]
        const savings_sbd_menu = [
            { value: tt('userwallet_jsx.withdraw_DEBT_TOKENS', {DEBT_TOKENS}), link: '#', onClick: showTransfer.bind( this, DEBT_TICKER, 'Savings Withdraw' ) },
        ]
        // set dynamic secondary wallet values
        const sbdInterest = this.props.sbd_interest / 100
        const sbdMessage = <span>{tt('userwallet_jsx.tokens_worth_about_1_of_LIQUID_TICKER', {TOKEN_WORTH, LIQUID_TICKER, sbdInterest})}</span>

        return (<div className="UserWallet">
            <div className="row">
                <div className="columns small-10 medium-12 medium-expand">
                    {isMyAccount
                        ? <WalletSubMenu account_name={account.get('name')} />
                        : <div>
                            <br />
                            <h4>{tt('g.balances')}</h4><br />
                          </div>
                    }
                </div>
            </div>
            <div className="UserWallet__balance row">
                <div className="column small-12 medium-8">
                    {LIQUID_TOKEN.toUpperCase()}<br />
                    <span className="secondary">{steemTip.split(".").map((a, index) => {if (a) {return <div key={index}>{a}.</div>;} return null;})}</span>
                </div>
                <div className="column small-12 medium-4">
                    {isMyAccount
                        ? <FoundationDropdownMenu
                            className="Wallet_dropdown"
                            dropdownPosition="bottom"
                            dropdownAlignment="right"
                            label={steem_balance_str}
                            menu={steem_menu}
                        />
                        : steem_balance_str
                    }
                    {steemOrders
                        ? <div style={{paddingRight: isMyAccount ? "0.85rem" : null}}>
                            <Link to="/market"><Tooltip t={tt('market_jsx.open_orders')}>(+{steem_orders_balance_str})</Tooltip></Link>
                         </div>
                        : null
                    }
                </div>
            </div>
            <div className="UserWallet__balance row zebra">
                <div className="column small-12 medium-8">
                    {VESTING_TOKEN.toUpperCase()}<br />
                    <span className="secondary">{powerTip.split(".").map((a, index) => {if (a) {return <div key={index}>{a}.</div>;} return null;})}
                    {tt('userwallet_jsx.top_dpos')} - <a target="_blank" href="https://dpos.space/golos-top/GP/">dpos.space <Icon name="extlink" /></a></span>
                </div>
                <div className="column small-12 medium-4">
                    {isMyAccount
                        ? <FoundationDropdownMenu
                            className="Wallet_dropdown"
                            dropdownPosition="bottom"
                            dropdownAlignment="right"
                            label={power_balance_str}
                            menu={power_menu}
                          />
                        : power_balance_str
                    }
                    {received_vesting_shares != 0 ? (
                            <div style={{ paddingRight: isMyAccount ? '0.85rem' : null }} >
                                <Tooltip t={tt('g.received_vesting', {VESTING_TOKEN})}>
                                    <a href="#" onClick={showDelegateVestingInfo.bind(this, 'received')}>
                                        + {received_vesting_shares_str}
                                    </a>
                                </Tooltip>
                            </div>
                        ) : null}
                    {delegated_vesting_shares != 0 ? (
                            <div style={{ paddingRight: isMyAccount ? '0.85rem' : null }} >
                                <Tooltip t={tt('g.delegated_vesting', {VESTING_TOKEN})}>
                                    <a href="#" onClick={showDelegateVestingInfo.bind(this, 'delegated')}>
                                        - {delegated_vesting_shares_str}
                                    </a>
                                </Tooltip>
                            </div>
                        ) : null}
                </div>
            </div>

            <div className="UserWallet__balance row">
                <div className="column small-12 medium-8">
                    {DEBT_TOKEN.toUpperCase()}<br />
                    <span className="secondary">{sbdMessage}</span>
                </div>
                <div className="column small-12 medium-4">
                    {isMyAccount
                        ? <FoundationDropdownMenu
                            className="Wallet_dropdown"
                            dropdownPosition="bottom"
                            dropdownAlignment="right"
                            label={sbd_balance_str}
                            menu={dollar_menu}
                          />
                        : sbd_balance_str
                    }
                    {sbdOrders 
                        ? <div style={{paddingRight: isMyAccount ? "0.85rem" : null}}>
                            <Link to="/market"><Tooltip t={tt('market_jsx.open_orders')}>(+{sbd_orders_balance_str})</Tooltip></Link>
                          </div>
                        : null
                    }
                    {conversions}
                </div>
            </div>
            <div className="UserWallet__balance row zebra">
                <div className="column small-12 medium-8">
                    {tt('userwallet_jsx.savings')}<br />
                    <span className="secondary">{tt('transfer_jsx.balance_subject_to_3_day_withdraw_waiting_period')}</span>
                </div>
                <div className="column small-12 medium-4">
                    {isMyAccount
                        ? <FoundationDropdownMenu
                            className="Wallet_dropdown"
                            dropdownPosition="bottom"
                            dropdownAlignment="right"
                            label={savings_balance_str}
                            menu={savings_menu}
                          />
                        : savings_balance_str
                    }
                    <br />
                    {isMyAccount
                        ? <FoundationDropdownMenu
                            className="Wallet_dropdown"
                            dropdownPosition="bottom"
                            dropdownAlignment="right"
                            label={savings_sbd_balance_str}
                            menu={savings_sbd_menu}
                          />
                        : savings_sbd_balance_str
                    }
                </div>
            </div>
            <div className="UserWallet__balance row">
                <div className="column small-12 medium-8">
                    {tt('userwallet_jsx.estimated_account_value')}<br />
                    <span className="secondary">{tt('tips_js.the_estimated_value_is_based_on_an_average_value_of_steem_in_US_dollars', {LIQUID_TOKEN})}</span>
                </div>
                <div className="column small-12 medium-4">
                    {estimate_output}
                </div>
            </div>
            <div className="UserWallet__balance row">
                <div className="column small-12">
                    {isWithdrawScheduled && <span>{tt('userwallet_jsx.next_power_down_is_scheduled_to_happen')}&nbsp; <TimeAgoWrapper date={account.get('next_vesting_withdrawal')} />.</span> }
                    {/*toggleDivestError && <div className="callout alert">{toggleDivestError}</div>*/}
                    <TransactionError opType="withdraw_vesting" />
                </div>
            </div>
            {disabledWarning && <div className="row">
                <div className="column small-12">
                    <div className="callout warning">
                        {tt('userwallet_jsx.transfers_are_temporary_disabled')}
                    </div>
                </div>
            </div>}
            <div className="row">
                <div className="column small-12">
                    <hr />
                </div>
            </div>

            {isMyAccount && <SavingsWithdrawHistory />}

            <div className="row">
                <div className="column small-12">
                    {/** history */}
                    <span className="secondary" style={{ float: 'right' }}><Icon name="new/search" /> {tt('userwallet_jsx.history_viewing')} - <a target="_blank" href="https://golos.cf">golos.cf <Icon name="extlink" /></a></span>
                    <h4>{tt('userwallet_jsx.history')}</h4>
                    <table>
                        <tbody>
                        {transfer_log}
                        </tbody>
                     </table>
                </div>
            </div>
        </div>);
    }
    componentDidMount() {
      //todo make transfer call a member? since code is repeated in some places
      const callTransfer = ({ to, amount, token, memo}) => {
      // immediate transfer processing (e.g. from foreign link)
      const transferType = 'Transfer to Account';
      this.props.showTransfer({
        to,
        asset: token.toUpperCase(), //since it's lowercased by koa
        transferType,
        memo,
        amount,
        disableMemo: true,
        disableTo: true,
        disableAmount: true
      });
    }
      const { transferDetails: { immediate, to, amount, token, memo } } = this.props;
      if (immediate) callTransfer({ to, amount, token, memo})
    }
}

export default connect(
    // mapStateToProps
    (state, ownProps) => {
        let price_per_golos = undefined
        const feed_price = state.global.get('feed_price')
        if(feed_price && feed_price.has('base') && feed_price.has('quote')) {
            const {base, quote} = feed_price.toJS()
            if(/ GBG$/.test(base) && / GOLOS$/.test(quote))
                price_per_golos = parseFloat(base.split(' ')[0]) / parseFloat(quote.split(' ')[0])
        }
        const savings_withdraws = state.user.get('savings_withdraws')
        const gprops = state.global.get('props');
        const sbd_interest = gprops.get('sbd_interest_rate')

        return {
            ...ownProps,
            open_orders: state.market.get('open_orders'),
            price_per_golos,
            savings_withdraws,
            sbd_interest,
            gprops
        }
    },
    // mapDispatchToProps
    dispatch => ({
        convertToSteem: (e) => {
            e.preventDefault()
            const name = 'convertToSteem'
            dispatch(g.actions.showDialog({name}))
        },
        showChangePassword: (username) => {
            const name = 'changePassword'
            dispatch(g.actions.remove({key: name}))
            dispatch(g.actions.showDialog({name, params: {username}}))
        },
        delegateVesting: (username) => {
            dispatch(g.actions.showDialog({name: 'delegate_vesting', params: {username}}))
        },
        showDelegatedVesting: (account, type) => {
            dispatch(g.actions.showDialog({name: 'delegate_vesting_info', params: {account, type}}))
        }
    })
)(UserWallet)
