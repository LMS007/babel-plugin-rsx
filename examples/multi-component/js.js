import {createHotContext as __vite__createHotContext} from "/@vite/client";
import.meta.hot = __vite__createHotContext("/multi-component/RsxExample.rsx");
import __vite__cjsImport0_react from "/@fs/C:/Users/kkeat/Documents/Code Projects/babel-plugin-rsx/node_modules/.vite/deps/react.js?v=a4cd5b42";
const useRef = __vite__cjsImport0_react["useRef"];
const useState = __vite__cjsImport0_react["useState"];
const useEffect = __vite__cjsImport0_react["useEffect"];
import {RSX} from "/@fs/C:/Users/kkeat/Documents/Code Projects/babel-plugin-rsx/src/types.ts";
function formatLabel(text) {
    return text.toUpperCase();
}
const Badge = RSX(_c = ({view}) => {
    view(props => /*#__PURE__*/
    _jsx("span", {
        style: {
            display: "inline-block",
            padding: "2px 8px",
            borderRadius: 12,
            fontSize: 12,
            fontWeight: "bold",
            backgroundColor: props.color || "#007bff",
            color: "#fff"
        },
        children: props.children
    }));
}
);
_c2 = Badge;
const Card = RSX(_c3 = ({view}) => {
    view(props => /*#__PURE__*/
    _jsxs("div", {
        style: {
            border: "1px solid #ddd",
            borderRadius: 8,
            padding: 16,
            marginBottom: 12,
            backgroundColor: "#fff",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
        },
        children: [/*#__PURE__*/
        _jsxs("div", {
            ref: props.ref,
            style: {
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 8
            },
            children: [/*#__PURE__*/
            _jsx("h4", {
                style: {
                    margin: 0,
                    color: "#555"
                },
                children: formatLabel(props.title)
            }), props.badge && /*#__PURE__*/
            _jsx(Badge, {
                color: props.badgeColor,
                children: props.badge
            })]
        }), /*#__PURE__*/
        _jsx("p", {
            style: {
                margin: 0,
                color: "#666"
            },
            children: props.children
        })]
    }));
}
);
_c4 = Card;
export default function MultiComponentDemo(__reactProps) {
    useEffect( () => {
        if (!__instance.__rsx_effectMounted) {
            __instance.__rsx_effectMounted = true;
            if (!__instance.__rsx_initialized) {
                __instance.__rsx_initialized = true;
                __userInit.call(this, __rsx_ctx);
                __rsx_render();
                __rsxForceUpdate(x => x + 1);
            }
        }
        return () => {
            if (__instance.__rsx_destroyCb) {
                __instance.__rsx_destroyCb();
            }
            __instance.__rsx_initialized = false;
            __instance.__rsx_effectMounted = false;
        }
        ;
    }
    , []);
    const [,__rsxForceUpdate] = useState(0);
    const __instanceRef = useRef(null);
    if (__instanceRef.current === null) {
        __instanceRef.current = {
            __rsx_initialized: false,
            __rsx_effectMounted: false,
            __rsx_prevProps: undefined,
            __rsx_currentProps: undefined,
            __rsx_updateCb: null,
            __rsx_viewCb: null,
            __rsx_destroyCb: null,
            __rsx_viewResult: null
        };
    }
    const __instance = __instanceRef.current;
    const __rsx_triggerRender = () => __rsxForceUpdate(x => x + 1);
    __instance.__rsx_prevProps = __instance.__rsx_currentProps;
    __instance.__rsx_currentProps = __reactProps;
    const __rsx_ctx = {
        view(fn) {
            __instance.__rsx_viewCb = fn;
        },
        update(fn) {
            __instance.__rsx_updateCb = fn;
        },
        destroy(fn) {
            __instance.__rsx_destroyCb = fn;
        },
        render() {
            __rsx_render();
            __rsx_triggerRender();
        },
        get props() {
            return __instance.__rsx_currentProps;
        }
    };
    function __rsx_render() {
        if (__instance.__rsx_viewCb) {
            __instance.__rsx_viewResult = __instance.__rsx_viewCb(__instance.__rsx_currentProps);
        }
    }
    function __userInit({view, update, destroy, render, props}) {
        view( () => /*#__PURE__*/
        _jsxs("div", {
            style: {
                fontFamily: "system-ui, sans-serif",
                maxWidth: 400
            },
            children: [/*#__PURE__*/
            _jsx("h3", {
                children: "Multi-Component Example"
            }), /*#__PURE__*/
            _jsx(Card, {
                title: "Welcome",
                badge: "New",
                badgeColor: "#28a745",
                children: "This card uses the Badge component defined in the same file."
            }), /*#__PURE__*/
            _jsx(Card, {
                title: "Features",
                badge: "RSX",
                badgeColor: "hsl(211, 100%, 50%)",
                children: "Multiple components can share helper functions like formatLabel()."
            }), /*#__PURE__*/
            _jsx(Card, {
                title: "Simple",
                children: "Cards without badges work too!"
            })]
        }));
    }
    if (!__instance.__rsx_initialized) {
        __instance.__rsx_initialized = true;
        __userInit.call(this, __rsx_ctx);
        __rsx_render();
    }
    if (__instance.__rsx_initialized && __instance.__rsx_prevProps !== undefined && __instance.__rsx_prevProps !== __instance.__rsx_currentProps) {
        if (__instance.__rsx_updateCb) {
            __instance.__rsx_updateCb(__instance.__rsx_prevProps, __instance.__rsx_currentProps);
        }
        __rsx_render();
    }
    return __instance.__rsx_viewResult ?? null;
}
_c5 = MultiComponentDemo;
var _c, _c2, _c3, _c4, _c5;
$RefreshReg$(_c, "Badge$RSX");
$RefreshReg$(_c2, "Badge");
$RefreshReg$(_c3, "Card$RSX");
$RefreshReg$(_c4, "Card");
$RefreshReg$(_c5, "MultiComponentDemo");
import*as RefreshRuntime from "/@react-refresh";
import __vite__cjsImport3_react_jsxRuntime from "/@fs/C:/Users/kkeat/Documents/Code Projects/babel-plugin-rsx/node_modules/.vite/deps/react_jsx-runtime.js?v=a4cd5b42";
const _jsx = __vite__cjsImport3_react_jsxRuntime["jsx"];
const _jsxs = __vite__cjsImport3_react_jsxRuntime["jsxs"];
const inWebWorker = typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope;
if (import.meta.hot && !inWebWorker) {
    if (!window.$RefreshReg$) {
        throw new Error("@vitejs/plugin-react can't detect preamble. Something is wrong.");
    }
    RefreshRuntime.__hmr_import(import.meta.url).then(currentExports => {
        RefreshRuntime.registerExportsForReactRefresh("C:/Users/kkeat/Documents/Code Projects/babel-plugin-rsx/examples/multi-component/RsxExample.rsx", currentExports);
        import.meta.hot.accept(nextExports => {
            if (!nextExports)
                return;
            const invalidateMessage = RefreshRuntime.validateRefreshBoundaryAndEnqueueUpdate("C:/Users/kkeat/Documents/Code Projects/babel-plugin-rsx/examples/multi-component/RsxExample.rsx", currentExports, nextExports);
            if (invalidateMessage)
                import.meta.hot.invalidate(invalidateMessage);
        }
        );
    }
    );
}
function $RefreshReg$(type, id) {
    return RefreshRuntime.register(type, "C:/Users/kkeat/Documents/Code Projects/babel-plugin-rsx/examples/multi-component/RsxExample.rsx" + ' ' + id);
}
function $RefreshSig$() {
    return RefreshRuntime.createSignatureFunctionForTransform();
}