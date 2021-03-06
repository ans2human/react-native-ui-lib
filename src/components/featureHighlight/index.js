import React from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import {StyleSheet, findNodeHandle, TouchableWithoutFeedback, Animated} from 'react-native';
import {BaseComponent} from '../../commons';
import View from '../view';
import Text from '../text';
import Button from '../button';
import {Colors} from '../../style';
import {Constants} from '../../helpers';
import {HighlighterOverlayView} from '../../nativeComponents';

const defaultOverlayColor = Colors.rgba(Colors.black, 0.82);
const defaultTextColor = Colors.white;
const defaultStrokeColor = Colors.rgba(Colors.white, 0.12);
const defaultStrokeWidth = 12;
const contentViewPadding = Constants.isIOS ? 35 : 32;
const contentViewRightMargin = Constants.isIOS ? 45 : 46;
const titleBottomMargin = Constants.isIOS ? 15 : 12;
const messageBottomMargin = Constants.isIOS ? 30 : 24;
const titleLineHeight = Constants.isAndroid ? 26 : 24;
const messageLineHeight = 22;
const defaultButtonLabel = 'Got it';
const contentViewHeight = Constants.isAndroid ? 268 : 282;

/*eslint-disable*/
/**
 * @description: FeatureHighlight component for feature discovery
 * @notes: 1) FeatureHighlight component must be a direct child of the root view returned in render().; 2) If the element to be highlighted doesn't have a style attribute add 'style={{opacity: 1}}' so the Android OS can detect it.
 * @important: FeatureHighlight uses a native library. You MUST add and link the native library to both iOS and Android projects. For instruction please see
 * @importantLink: https://facebook.github.io/react-native/docs/linking-libraries-ios.html
 * @extends: HighlighterOverlayView
 * @extendslink: docs/HighlighterOverlayView
 * @gif: https://media.giphy.com/media/3ohs4D5irZm5GojsDS/giphy.gif, https://media.giphy.com/media/3oxQNaDQckPZI78rWo/giphy.gif
 * @example: https://github.com/wix/react-native-ui-lib/blob/master/demo/src/screens/componentScreens/FeatureHighlightScreen.js
 */
/*eslint-enable*/
class FeatureHighlight extends BaseComponent {
  static displayName = 'FeatureHighlight';
  static propTypes = {
    /**
     * Boolean to determine if to present the feature highlight component
     */
    visible: PropTypes.bool.isRequired,
    /**
     * Frame of the area to highlight {x, y, width, height}
     */
    highlightFrame: PropTypes.shape({
      x: PropTypes.number,
      y: PropTypes.number,
      width: PropTypes.number,
      height: PropTypes.number,
    }),
    /**
     * Callback that extract the ref of the element to be highlighted
     */
    getTarget: PropTypes.func,
    /**
     * Title of the content to be displayed
     */
    title: PropTypes.string,
    /**
     * Message to be displayed
     */
    message: PropTypes.string,
    /**
     * Title's max number of lines
     */
    titleNumberOfLines: PropTypes.number,
    /**
     * Message's max number of lines
     */
    messageNumberOfLines: PropTypes.number,
    /**
     * Props that will be passed to the dismiss button
     */
    confirmButtonProps: PropTypes.object,
    /**
     * Callback for the background press
     */
    onBackgroundPress: PropTypes.func,
    /**
     * Color of the content's background (usually includes alpha for transparency)
     */
    overlayColor: PropTypes.string,
    /**
     * Color of the content's text
     */
    textColor: PropTypes.string,
    /**
     * Color of the border around the highlighted element
     */
    borderColor: PropTypes.string,
    /**
     * Width of the border around the highlighted element
     */
    borderWidth: PropTypes.number,
    /**
     * The minimum size of the highlighted component (Android API 21+, and only when passing a ref in 'getTarget')
     */
    minimumRectSize: PropTypes.shape({
      width: PropTypes.number,
      height: PropTypes.number,
    }),
    /**
     * The padding of the highlight frame around the highlighted element's frame (only when passing ref in 'getTarget')
     */
    innerPadding: PropTypes.number,
    /**
     * Use to identify the component in tests
     */
    testID: PropTypes.string,
  };

  constructor(props) {
    super(props);

    this.getComponentDimensions = this.getComponentDimensions.bind(this);
    this.setTargetPosition = this.setTargetPosition.bind(this);

    this.state = {
      fadeAnim: new Animated.Value(0),  // Initial value for opacity: 0
      contentTopPosition: 0,
    };

    this.contentHeight = contentViewHeight;
    this.targetPosition = undefined;
    this.didLayout = false;
  }

  static defaultProps = {
    minimumRectSize: {width: 56, height: 56},
    innerPadding: 10,
  };

  componentDidMount() {
    this.setTargetPosition();
  }

  componentWillReceiveProps(nextProps) {
    this.setTargetPosition(nextProps);
  }

  findTargetNode(target) {
    return findNodeHandle(target);
  }

  animate(toValue) {
    Animated.timing(                  // Animate over time
      this.state.fadeAnim,            // The animated value to drive
      {
        toValue,                      // Animate to value
        duration: toValue ? 100 : 0,   // Make it take a while
      },
    ).start();                        // Starts the animation
  }

  setTargetPosition(props = this.props) {
    if (props.getTarget !== undefined) {
      const target = props.getTarget();

      const node = this.findTargetNode(target);
      this.setState({node});
      if (target) {
        setTimeout(() => {
          target.measureInWindow((x, y, width, height) => {
            this.targetPosition = {left: x, top: y, width, height};
            this.setContentPosition();
          });
        }, 0);
      }
    } else {
      const frame = props.highlightFrame;
      if (frame) {
        this.targetPosition = {left: frame.x, top: frame.y, width: frame.width, height: frame.height};
        this.setContentPosition();
      }
    }
  }

  getContentPosition() {
    if (this.didLayout) {
      const {highlightFrame, minimumRectSize, innerPadding} = this.props;
      const {top, height} = this.targetPosition;
      const screenVerticalCenter = Constants.screenHeight / 2;
      const targetCenter = top + (height / 2);
      const isAlignedTop = targetCenter > screenVerticalCenter;
      let topPosition = isAlignedTop ? top - this.contentHeight : top + height;
      if (!highlightFrame && !isAlignedTop) {
        const minRectHeight = minimumRectSize.height;
        const isUnderMin = height >= minRectHeight;
        topPosition = isUnderMin ? topPosition + innerPadding : targetCenter + (minRectHeight / 2) + (innerPadding / 2);
      }
      if (topPosition < 0 || topPosition + this.contentHeight > Constants.screenHeight) {
        console.warn('Content is too long and might appear off screen. ' +
          'Please adjust the message length for better results.');
      }
      return topPosition;
    }
  }

  setContentPosition() {
    const top = this.getContentPosition();
    this.setState({contentViewStyle: top});
    this.animate(1);
  }

  // This method will be called more than once in case of layout change!
  getComponentDimensions(event) {
    this.didLayout = true;
    this.contentHeight = event.nativeEvent.layout.height;
    if (this.targetPosition !== undefined) {
      this.setContentPosition();
    }
  }

  onPress = () => {
    this.animate(0);
    this.contentHeight = contentViewHeight;
    this.didLayout = false;
    this.targetPosition = undefined;
    const {confirmButtonProps} = this.props;
    _.invoke(confirmButtonProps, 'onPress');
  }

  renderHighlightMessage() {
    const {title, message, confirmButtonProps, textColor, titleNumberOfLines, messageNumberOfLines}
      = this.getThemeProps();
    const color = textColor || defaultTextColor;

    return (
      <Animated.View
        style={[styles.highlightContent, {opacity: this.state.fadeAnim, top: this.state.contentViewStyle}]}
        onLayout={this.getComponentDimensions}
        pointerEvents="box-none"
      >
        {title && (
          <Text text60 style={[styles.title, {color}]} numberOfLines={titleNumberOfLines} pointerEvents="none">
            {title}
          </Text>
        )}
        {message && (
          <Text text70 style={[styles.message, {color}]} numberOfLines={messageNumberOfLines} pointerEvents="none">
            {message}
          </Text>
        )}
        <Button
          label={defaultButtonLabel}
          size="small"
          outline
          outlineColor={color}
          activeBackgroundColor={Colors.rgba(color, 0.3)}
          {...confirmButtonProps}
          onPress={this.onPress}
        />
      </Animated.View>
    );
  }

  render() {
    const {testID, visible, highlightFrame, overlayColor, borderColor, borderWidth, minimumRectSize, innerPadding,
      onBackgroundPress} = this.getThemeProps();
    const {node} = this.state;

    return (
      <HighlighterOverlayView
        testID={testID}
        highlightViewTag={node}
        highlightFrame={highlightFrame}
        visible={visible}
        overlayColor={overlayColor || defaultOverlayColor}
        strokeColor={borderColor || defaultStrokeColor}
        strokeWidth={borderWidth || defaultStrokeWidth}
        minimumRectSize={minimumRectSize}
        innerPadding={innerPadding}
      >
        <TouchableWithoutFeedback style={styles.touchableOverlay} onPress={onBackgroundPress}>
          <View flex/>
        </TouchableWithoutFeedback>
        {this.renderHighlightMessage()}
      </HighlighterOverlayView>
    );
  }
}

const styles = StyleSheet.create({
  highlightContent: {
    position: 'absolute',
    padding: contentViewPadding,
    marginRight: contentViewRightMargin,
    alignItems: 'flex-start',
  },
  title: {
    fontWeight: '500',
    marginBottom: titleBottomMargin,
    lineHeight: titleLineHeight,
  },
  message: {
    marginBottom: messageBottomMargin,
    lineHeight: messageLineHeight,
  },
  touchableOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
});

export default FeatureHighlight;
