import React from 'react';
import PropTypes from 'prop-types'
import Comment from 'app/components/cards/Comment';
import PostFull from 'app/components/cards/PostFull';
import {connect} from 'react-redux';
import {sortComments} from 'app/utils/comments';
import FoundationDropdownMenu from 'app/components/elements/FoundationDropdownMenu';
import IllegalContentMessage from 'app/components/elements/IllegalContentMessage';
import {Set} from 'immutable'
import tt from 'counterpart';
import shouldComponentUpdate from 'app/utils/shouldComponentUpdate';
import { blockedUsers } from 'app/utils/IllegalContent';
import { buttonClick } from 'app/utils/Analytics';

import CTABlock from '../elements/CTA/CTABlock'

class Post extends React.Component {
    static propTypes = {
        content: PropTypes.object.isRequired,
        post: PropTypes.string,
        aiPosts: PropTypes.array,
        routeParams: PropTypes.object,
        location: PropTypes.object,
        signup_bonus: PropTypes.string,
        current_user: PropTypes.object,
    };

    constructor() {
        super();
        this.state = {
            showNegativeComments: false
        };
        this.shouldComponentUpdate = shouldComponentUpdate(this, 'Post')
    }

    componentDidMount() {
        if (window.location.hash.indexOf('comments') !== -1) {
            const comments_el = document.getElementById('comments');
            if (comments_el) comments_el.scrollIntoView();
        }
    }

    toggleNegativeReplies = (e) => {
        this.setState({
            showNegativeComments: !this.state.showNegativeComments
        });
        e.preventDefault();
    };

    onHideComment = () => {
        this.setState({commentHidden: true})
    }

    showAnywayClick = () => {
        this.setState({showAnyway: true})
    }

    render() {
        const LIQUID_TOKEN = tt('token_names.LIQUID_TOKEN')

        const {current_user, ignoring, signup_bonus, content} = this.props
        const {showNegativeComments, commentHidden, showAnyway} = this.state
        let post = this.props.post;
        const aiPosts = this.props.aiPosts;
        if (!post) {
            const route_params = this.props.routeParams;
            post = route_params.username + '/' + route_params.slug;
        }
        const dis = content.get(post);

        if (!dis) return null;

        if(!showAnyway) {
            const {gray} = dis.get('stats').toJS()
            if(gray) {
                return (
                    <div className="Post">
                        <div className="row">
                            <div className="column">
                                <div className="PostFull">
                                    <p onClick={this.showAnywayClick}>{tt('promote_post_jsx.this_post_was_hidden_due_to_low_ratings')}.{' '}
                                    <button style={{marginBottom: 0}} className="button hollow tiny float-right" onClick={this.showAnywayClick}>{tt('g.show')}</button></p>
                                </div>
                            </div>
                        </div>
                        
                    </div>
                )
            }
        }

        let replies = dis.get('replies').toJS();

        let sort_order = 'trending';
        if( this.props.location && this.props.location.query.sort )
           sort_order = this.props.location.query.sort;

        const commentLimit = 100;
        if (global['process'] !== undefined && replies.length > commentLimit) {
            console.log(`Too many comments, ${replies.length - commentLimit} omitted.`);
            replies = replies.slice(0, commentLimit);
        }

        sortComments( content, replies, sort_order );
        const keep = a => {
            const c = content.get(a);
            const hide = c.getIn(['stats', 'hide'])
            let ignore = false
            if(ignoring) {
                ignore = ignoring.has(c.get('author'))
                // if(ignore) console.log(current_user && current_user.get('username'), 'is ignoring post author', c.get('author'), '\t', a)
            }
            return !hide && !ignore
        }
        const positiveComments = replies.filter(a => keep(a))
            .map(reply => (
                <Comment
                    root
                    key={post + reply}
                    content={reply}
                    cont={content}
                    sortOrder={sort_order}
                    showNegativeComments={showNegativeComments}
                    onHide={this.onHideComment}
                    ignoreList={ignoring}
                />)
            );

        const negativeGroup = commentHidden &&
            (<div className="hentry Comment root Comment__negative_group">
                <p>
                    {tt(showNegativeComments ? 'post_jsx.now_showing_comments_with_low_ratings' : 'post_jsx.comments_were_hidden_due_to_low_ratings')}.{' '}
                    <button className="button hollow tiny float-right" onClick={e => this.toggleNegativeReplies(e)}>
                        {tt(showNegativeComments ? 'g.hide' :'g.show')}
                    </button>
                </p>
            </div>);


        let sort_orders = [ 'trending', 'votes', 'new', 'old'];
        let sort_labels = [ tt('main_menu.trending'), tt('g.votes'), tt('g.created'), tt('g.old') ];
        let sort_menu = [];
        let sort_label;

        let selflink = `/${dis.get('category')}/@${post}`;
        for( let o = 0; o < sort_orders.length; ++o ){
            if(sort_orders[o] == sort_order) sort_label = sort_labels[o];
            sort_menu.push({
                value: sort_orders[o],
                label: sort_labels[o],
                link: selflink + '?sort=' + sort_orders[o] + '#comments'
            });
        }
        const emptyPost = dis.get('created') === '1970-01-01T00:00:00' && dis.get('body') === ''
        if(emptyPost)
            return <center>
                <div className="NotFound float-center">
                    <div>
                        <h4 className="NotFound__header">Sorry! This page doesnt exist.</h4>
                        <p>Not to worry. You can head back to <a style={{fontWeight: 800}} href="/">our homepage</a>,
                            or check out some great posts.
                        </p>
                        <ul className="NotFound__menu">
                            <li><a href="/created">new posts</a></li>
                            <li><a href="/hot">hot posts</a></li>
                            <li><a href="/trending">trending posts</a></li>
                            <li><a href="/promoted">promoted posts</a></li>
                            <li><a href="/active">active posts</a></li>
                        </ul>
                    </div>
                </div>
            </center>

          if(blockedUsers.includes(post.split("/")[0])) {
            return (<IllegalContentMessage />)
          }
          
        return (
            <div className="Post">
                <div className="row">
                    <div className="column">
                        <PostFull post={post} cont={content} aiPosts={aiPosts} />
                    </div>
                </div>

                {/* Disable promo for registration FIXME
                {!current_user && <div className="row">
                <CTABlock post={post}/>

                    <div className="column">
                        <div className="Post__promo">
                            {tt('g.next_7_strings_sinngle_block.authors_get_paid_when_people_like_you_upvote_their_post')}.
                            <br /> {tt('g.next_7_strings_sinngle_block.if_you_enjoyed_what_you_read_earn_amount')}
                            <br />
                            <a className="button sign-up" 
                                href="/create_account"
                                onClick={() => buttonClick()}
                            >{tt('g.next_7_strings_sinngle_block.sign_up_now_to_receive')}
                                <span className="free-money">{tt('g.next_7_strings_sinngle_block.free_steem', {LIQUID_TOKEN})}</span>
                            </a>
                        </div>
                    </div>
                </div>}

                */}

                <div className="row hfeed">
                  <iframe data-aa="1150095" src="//acceptable.a-ads.com/1150095" scrolling="no" style={{
                    border: '0px',
                    padding: '0',
                    maxWidth: '50rem',
                    margin: '0 auto',
                    width: '100%',
                    overflow: 'hidden'}} allowtransparency="true"></iframe>
                </div>

          
                <div id="comments" className="Post_comments row hfeed">
                    <div className="column large-12">
                        <div className="Post_comments__content">
                            {positiveComments.length ?
                            (<div className="Post__comments_sort_order float-right">
                                {tt('post_jsx.sort_order')}: &nbsp;
                                <FoundationDropdownMenu menu={sort_menu} label={sort_label} dropdownPosition="bottom" dropdownAlignment="right" />
                            </div>) : null}
                            {positiveComments}
                            {negativeGroup}
                        </div>
                    </div>
                </div>                
            </div>
        );
    }
}

const emptySet = Set()

export default connect((state, props) => {
    const current_user = state.user.get('current')

    let { post } = props;
    if (!post) {
        const route_params = props.routeParams;
        post = route_params.username + '/' + route_params.slug;
    }
    const dis = state.global.get('content').get(post);

    let ignoring = new Set()

    if (dis && state.global.get('follow')) {
        const key = ['follow', 'getFollowingAsync', dis.get('author'), 'ignore_result']
        ignoring = state.global.getIn(key, emptySet)
    }

    if (current_user) {
        const key = ['follow', 'getFollowingAsync', current_user.get('username'), 'ignore_result']
        ignoring = new Set([...ignoring, ...state.global.getIn(key, emptySet)])
    }

    return {
        content: state.global.get('content'),
        signup_bonus: state.offchain.get('signup_bonus'),
        current_user,
        ignoring,
    }
}
)(Post);
