import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
    MousePointer2,
    Square,
    Circle,
    Minus,
    PenTool,
    Type,
    Download,
    Trash2,
    Copy,
    Layers,
    ChevronUp,
    ChevronDown,
    X,
    Bold,
    Italic,
    Underline,
    Play,
    Save,
    RotateCcw,
    Plus,
    ChevronDown as DropdownIcon,
    FileText,
    Maximize2,
    ZoomIn,
    ZoomOut,
    Home,
    Grid,
    Image as ImageIcon,
    Upload,
    Code,
    Palette,
    Sliders,
    RotateCw,
    Grip,
} from 'lucide-react';

const uid = () => "id" + Math.random().toString(36).slice(2, 9);

const tools = [
    { id: 'select', name: 'Select', icon: MousePointer2, shortcut: 'V' },
    { id: 'rect', name: 'Rectangle', icon: Square, shortcut: 'R' },
    { id: 'ellipse', name: 'Ellipse', icon: Circle, shortcut: 'O' },
    { id: 'line', name: 'Line', icon: Minus, shortcut: 'L' },
    { id: 'path', name: 'Pen', icon: PenTool, shortcut: 'P' },
    { id: 'text', name: 'Text', icon: Type, shortcut: 'T' },
    { id: 'image', name: 'Image', icon: ImageIcon, shortcut: 'I' }
];

const animations = [
    { value: '', label: 'No Animation' },
    { value: 'fadeIn', label: 'Fade In' },
    { value: 'slideUp', label: 'Slide Up' },
    { value: 'slideDown', label: 'Slide Down' },
    { value: 'slideLeft', label: 'Slide Left' },
    { value: 'slideRight', label: 'Slide Right' },
    { value: 'zoomIn', label: 'Zoom In' },
    { value: 'zoomOut', label: 'Zoom Out' },
    { value: 'bounce', label: 'Bounce' },
    { value: 'pulse', label: 'Pulse' },
    { value: 'shake', label: 'Shake' },
    { value: 'rotate', label: 'Rotate' },
    { value: 'flip', label: 'Flip' }
];

const canvasPresets = [
    { id: 'desktop', name: 'Desktop', width: 1920, height: 1080 },
    { id: 'tablet', name: 'Tablet', width: 1024, height: 768 },
    { id: 'mobile', name: 'Mobile', width: 812, height: 375 },
    { id: 'square', name: 'Square', width: 800, height: 800 },
    { id: 'banner', name: 'Banner', width: 1200, height: 300 },
    { id: 'story', name: 'Instagram Story', width: 1920, height: 1080 },
    { id: 'post', name: 'Instagram Post', width: 1080, height: 1080 }
];

export default function EnhancedMiniFigma() {
    const [state, setState] = useState({
        tool: 'select',
        fill: '#3b82f6',
        fillType: 'solid', // 'solid', 'gradient', 'image'
        fillGradient: {
            start: '#5e81f7',
            end: '#a855f7',
            angle: 90,
        },
        fillImage: null,
        opacity: 1,
        stroke: '#1f2937',
        strokeW: 2,
        fontSize: 24,
        text: "",
        textBold: false,
        textItalic: false,
        textUnderline: false,
        elements: [],
        selection: null,
        history: [],
        historyIndex: -1,
        panning: false,
        zoom: 1,
        panX: 0,
        panY: 0,
        showGrid: true,
        canvasBg: '#ffffff',
        canvasBgImage: null,
        canvasRotation: 0,
        isDragging: false,
        dragOffset: { x: 0, y: 0 },
        resizeHandle: null
    });

    const [canvases, setCanvases] = useState([]);
    const [activeCanvas, setActiveCanvas] = useState(null);
    const [showCanvasDropdown, setShowCanvasDropdown] = useState(false);
    const [drawing, setDrawing] = useState(null);
    const [mouseDown, setMouseDown] = useState(false);
    const [textEditor, setTextEditor] = useState(null);
    const [animationSettings, setAnimationSettings] = useState({
        type: '',
        duration: 1,
        delay: 0
    });
    const [codeOutputType, setCodeOutputType] = useState('html');
    const [propertyPanelOpen, setPropertyPanelOpen] = useState(true);
    const [codePanelOpen, setCodePanelOpen] = useState(true);
    const [imageUploadData, setImageUploadData] = useState(null);
    const [editingTextElement, setEditingTextElement] = useState(null);
    const [pathPoints, setPathPoints] = useState([]);
    const [isPathDrawing, setIsPathDrawing] = useState(false);
    const [customCanvasSize, setCustomCanvasSize] = useState({ width: 800, height: 600 });

    const canvasRef = useRef(null);
    const stageRef = useRef(null);
    const fileInputRef = useRef(null);
    const bgFileInputRef = useRef(null);
    const fillImageInputRef = useRef(null);
    const textEditRef = useRef(null);
    const [viewportSize, setViewportSize] = useState({ width: 1200, height: 800 });

    useEffect(() => {
        const updateSize = () => {
            if (stageRef.current) {
                const rect = stageRef.current.getBoundingClientRect();
                setViewportSize({
                    width: Math.floor(rect.width),
                    height: Math.floor(rect.height)
                });
            }
        };
        updateSize();
        window.addEventListener('resize', updateSize);
        return () => window.removeEventListener('resize', updateSize);
    }, []);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.ctrlKey || e.metaKey) && !textEditor && !editingTextElement) {
                const tool = tools.find(t => t.shortcut.toLowerCase() === e.key.toLowerCase());
                if (tool) {
                    e.preventDefault();
                    if (tool.id === 'image') {
                        fileInputRef.current?.click();
                    } else {
                        updateState({ tool: tool.id });
                    }
                    return;
                }
            }

            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
                e.preventDefault();
                if (e.shiftKey) {
                    redo();
                } else {
                    undo();
                }
                return;
            }
            
            const isDeleteKey = e.key === 'Delete';
            const isCtrlBackspace = (e.ctrlKey || e.metaKey) && e.key === 'Backspace';
            if ((isDeleteKey || isCtrlBackspace) && state.selection && !textEditor && !editingTextElement) {
                e.preventDefault();
                deleteSelected();
            }

            if (e.code === 'Space' && !textEditor && !editingTextElement) {
                e.preventDefault();
                updateState({ panning: true });
            }
            if ((e.ctrlKey || e.metaKey) && e.key === '0') {
                e.preventDefault();
                resetView();
            }
            if ((e.ctrlKey || e.metaKey) && (e.key === '=' || e.key === '+')) {
                e.preventDefault();
                zoomIn();
            }
            if ((e.ctrlKey || e.metaKey) && e.key === '-') {
                e.preventDefault();
                zoomOut();
            }
            if ((e.ctrlKey || e.metaKey) && e.key === '\\') {
                e.preventDefault();
                setPropertyPanelOpen(prev => !prev);
            }
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === '\\') {
                e.preventDefault();
                setCodePanelOpen(prev => !prev);
            }
            if (e.key === 'j' && !e.ctrlKey && !e.metaKey && activeCanvas) {
                e.preventDefault();
                rotateCanvas();
            }
        };

        const handleKeyUp = (e) => {
            if (e.code === 'Space') {
                updateState({ panning: false });
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [state.selection, textEditor, editingTextElement, activeCanvas]);

    const updateState = useCallback((updates) => {
        setState(prev => ({ ...prev, ...updates }));
    }, []);

    useEffect(() => {
        if (state.selection) {
            setState(prev => ({
                ...prev,
                elements: prev.elements.map(el =>
                    el.id === prev.selection
                        ? {
                            ...el,
                            fill: state.fill,
                            fillType: state.fillType,
                            fillGradient: state.fillGradient,
                            fillImage: state.fillImage,
                            opacity: state.opacity,
                            stroke: state.stroke,
                            strokeW: state.strokeW,
                            ...(el.type === 'text' && {
                                fontSize: state.fontSize,
                                fontWeight: state.textBold ? 'bold' : 'normal',
                                fontStyle: state.textItalic ? 'italic' : 'normal',
                                textDecoration: state.textUnderline ? 'underline' : 'none'
                            })
                        }
                        : el
                )
            }));
        }
    }, [state.fill, state.fillType, state.fillGradient, state.fillImage, state.opacity, state.stroke, state.strokeW, state.fontSize, state.textBold, state.textItalic, state.textUnderline, state.selection]);
    
    const getCenteredView = (canvas, viewport) => {
        if (!canvas || !viewport.width || !viewport.height) {
            return { zoom: 1, panX: 0, panY: 0 };
        }
        const padding = 100;
        const scaleX = (viewport.width - padding) / canvas.width;
        const scaleY = (viewport.height - padding) / canvas.height;
        const zoom = Math.min(scaleX, scaleY, 1);
        const panX = (viewport.width - canvas.width * zoom) / 2;
        const panY = (viewport.height - canvas.height * zoom) / 2;
        return { zoom, panX, panY };
    };

    const createCanvas = (preset) => {
        const newCanvas = {
            id: uid(),
            name: `${preset.name} Canvas`,
            width: preset.width,
            height: preset.height,
            elements: [],
            canvasBg: '#ffffff',
            canvasBgImage: null,
            createdAt: new Date().toISOString()
        };
        setCanvases(prev => [...prev, newCanvas]);
        setActiveCanvas(newCanvas);
        const { zoom, panX, panY } = getCenteredView(newCanvas, viewportSize);
        setState(prev => ({
            ...prev,
            elements: [],
            selection: null,
            history: [],
            historyIndex: -1,
            zoom,
            panX,
            panY,
            canvasBg: '#ffffff',
            canvasBgImage: null,
            canvasRotation: 0
        }));
        setShowCanvasDropdown(false);
    };

    const switchCanvas = (canvas) => {
        if (activeCanvas) {
            setCanvases(prev => prev.map(c =>
                c.id === activeCanvas.id
                    ? {
                        ...c,
                        elements: state.elements,
                        canvasBg: state.canvasBg,
                        canvasBgImage: state.canvasBgImage
                    }
                    : c
            ));
        }
        setActiveCanvas(canvas);
        const { zoom, panX, panY } = getCenteredView(canvas, viewportSize);
        setState(prev => ({
            ...prev,
            elements: canvas.elements,
            selection: null,
            zoom,
            panX,
            panY,
            canvasBg: canvas.canvasBg || '#ffffff',
            canvasBgImage: canvas.canvasBgImage || null,
            canvasRotation: canvas.canvasRotation || 0
        }));
        setShowCanvasDropdown(false);
    };
    
    const handleCanvasDimensionChange = (dimension, value) => {
        if (!activeCanvas || value <= 0) return;
        const newDimensions = {
            ...activeCanvas,
            [dimension]: value,
        };
        setActiveCanvas(newDimensions);
        setCanvases(canvases.map(c => c.id === activeCanvas.id ? newDimensions : c));
        const { zoom, panX, panY } = getCenteredView(newDimensions, viewportSize);
        updateState({ zoom, panX, panY });
    }

    const commitCanvasChanges = () => {
        pushHistory();
    }

    const pushHistory = useCallback(() => {
        setState(prev => {
            const newHistory = prev.history.slice(0, prev.historyIndex + 1);
            newHistory.push(JSON.stringify({
                elements: prev.elements,
                canvasBg: prev.canvasBg,
                canvasBgImage: prev.canvasBgImage,
                canvasRotation: prev.canvasRotation
            }));
            return {
                ...prev,
                history: newHistory.slice(-50),
                historyIndex: Math.min(newHistory.length - 1, 49)
            };
        });
    }, []);

    const undo = useCallback(() => {
        setState(prev => {
            if (prev.historyIndex > 0) {
                const newIndex = prev.historyIndex - 1;
                const historyData = JSON.parse(prev.history[newIndex]);
                return {
                    ...prev,
                    elements: historyData.elements,
                    canvasBg: historyData.canvasBg,
                    canvasBgImage: historyData.canvasBgImage,
                    canvasRotation: historyData.canvasRotation || 0,
                    historyIndex: newIndex,
                    selection: null
                };
            }
            return prev;
        });
    }, []);

    const redo = useCallback(() => {
        setState(prev => {
            if (prev.historyIndex < prev.history.length - 1) {
                const newIndex = prev.historyIndex + 1;
                const historyData = JSON.parse(prev.history[newIndex]);
                return {
                    ...prev,
                    elements: historyData.elements,
                    canvasBg: historyData.canvasBg,
                    canvasBgImage: historyData.canvasBgImage,
                    canvasRotation: historyData.canvasRotation || 0,
                    historyIndex: newIndex,
                    selection: null
                };
            }
            return prev;
        });
    }, []);
    
    const zoomIn = () => updateState({ zoom: Math.min(state.zoom * 1.2, 5) });
    const zoomOut = () => updateState({ zoom: Math.max(state.zoom / 1.2, 0.1) });

    const resetView = () => {
        if (!activeCanvas) return;
        const zoom = 1;
        const panX = (viewportSize.width - activeCanvas.width * zoom) / 2;
        const panY = (viewportSize.height - activeCanvas.height * zoom) / 2;
        updateState({ zoom, panX, panY });
    };

    const fitToScreen = () => {
        if (!activeCanvas) return;
        const { zoom, panX, panY } = getCenteredView(activeCanvas, viewportSize);
        updateState({ zoom, panX, panY });
    };

    const rotateCanvas = () => {
        if (!activeCanvas) return;
        const newRotation = (state.canvasRotation + 90) % 360;
        updateState({ canvasRotation: newRotation });
        pushHistory();
    };

    const getMouse = useCallback((e) => {
        if (!canvasRef.current) return { x: 0, y: 0 };
        const rect = canvasRef.current.getBoundingClientRect();
        return {
            x: (e.clientX - rect.left) / state.zoom,
            y: (e.clientY - rect.top) / state.zoom,
        };
    }, [state.zoom]);

    const hitTest = useCallback((point) => {
        for (let i = state.elements.length - 1; i >= 0; i--) {
            const el = state.elements[i];
            const bbox = getBbox(el);
            if (point.x >= bbox.x && point.x <= bbox.x + bbox.w &&
                point.y >= bbox.y && point.y <= bbox.y + bbox.h) {
                return { id: el.id, element: el };
            }
        }
        return null;
    }, [state.elements]);
    
    const measureText = (text, size) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        ctx.font = `${size}px Inter, system-ui`;
        return ctx.measureText(text);
    };

    const getBbox = (el) => {
        switch (el.type) {
            case 'rect':
                return { x: el.x, y: el.y, w: el.w, h: el.h };
            case 'ellipse':
                return { x: el.cx - el.rx, y: el.cy - el.ry, w: el.rx * 2, h: el.ry * 2 };
            case 'line':
                return {
                    x: Math.min(el.x1, el.x2) - el.strokeW,
                    y: Math.min(el.y1, el.y2) - el.strokeW,
                    w: Math.abs(el.x2 - el.x1) + el.strokeW * 2,
                    h: Math.abs(el.y2 - el.y1) + el.strokeW * 2
                };
            case 'text':
                const measure = measureText(el.text, el.fontSize);
                return { x: el.x, y: el.y - el.fontSize, w: measure.width, h: el.fontSize * 1.2 };
            case 'path':
                if (!el.points || el.points.length === 0) return { x: 0, y: 0, w: 0, h: 0 };
                const xs = el.points.map(p => p.x);
                const ys = el.points.map(p => p.y);
                const minX = Math.min(...xs);
                const maxX = Math.max(...xs);
                const minY = Math.min(...ys);
                const maxY = Math.max(...ys);
                return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
            default:
                return { x: 0, y: 0, w: 0, h: 0 };
        }
    };
    
    const getResizeHandle = (point, bbox) => {
        const handleSize = 10 / state.zoom;
        const handles = [
            { id: 'nw', x: bbox.x, y: bbox.y },
            { id: 'ne', x: bbox.x + bbox.w, y: bbox.y },
            { id: 'sw', x: bbox.x, y: bbox.y + bbox.h },
            { id: 'se', x: bbox.x + bbox.w, y: bbox.y + bbox.h },
            { id: 'n', x: bbox.x + bbox.w / 2, y: bbox.y },
            { id: 'e', x: bbox.x + bbox.w, y: bbox.y + bbox.h / 2 },
            { id: 's', x: bbox.x + bbox.w / 2, y: bbox.y + bbox.h },
            { id: 'w', x: bbox.x, y: bbox.y + bbox.h / 2 },
        ];
        for (const handle of handles) {
            if (Math.abs(point.x - handle.x) < handleSize / 2 && Math.abs(point.y - handle.y) < handleSize / 2) {
                return handle.id;
            }
        }
        return null;
    };

    const handleMouseDown = (e) => {
        if (e.button !== 0 || !activeCanvas) return;
        const point = getMouse(e);
        setMouseDown(true);
    
        if (state.tool !== 'select' && (point.x < 0 || point.x > activeCanvas.width || point.y < 0 || point.y > activeCanvas.height)) {
            setMouseDown(false);
            return;
        }
    
        if (state.panning) {
            e.preventDefault();
            return;
        }
    
        if (state.tool === 'select') {
            const hit = hitTest(point);
            if (hit) {
                const bbox = getBbox(hit.element);
                const handle = getResizeHandle(point, bbox);
    
                updateState({
                    selection: hit.id,
                    fill: hit.element.fill || '#3b82f6',
                    fillType: hit.element.fillType || 'solid',
                    fillGradient: hit.element.fillGradient || { start: '#5e81f7', end: '#a855f7', angle: 90 },
                    fillImage: hit.element.fillImage || null,
                    opacity: hit.element.opacity ?? 1,
                    stroke: hit.element.stroke || '#1f2937',
                    strokeW: hit.element.strokeW || 2,
                    ...(hit.element.type === 'text' && {
                        fontSize: hit.element.fontSize,
                        textBold: hit.element.fontWeight === 'bold',
                        textItalic: hit.element.fontStyle === 'italic',
                        textUnderline: hit.element.textDecoration === 'underline'
                    })
                });
    
                if (handle) {
                    updateState({
                        resizeHandle: handle,
                        isDragging: false
                    });
                } else {
                    updateState({
                        isDragging: true,
                        resizeHandle: null,
                        dragOffset: {
                            x: point.x - bbox.x,
                            y: point.y - bbox.y
                        }
                    });
                }
            } else {
                updateState({ selection: null });
            }
            return;
        }
    
        if (state.tool === 'path') {
            if (!isPathDrawing) {
                setIsPathDrawing(true);
                setPathPoints([{ ...point }]);
            } else {
                setPathPoints([...pathPoints, { ...point }]);
            }
            return;
        }
    
        const id = uid();
        const base = {
            id,
            stroke: state.stroke,
            strokeW: state.strokeW,
            fill: state.fill,
            fillType: state.fillType,
            fillGradient: state.fillGradient,
            fillImage: state.fillImage,
            opacity: state.opacity,
        };
    
        let newDrawing;
        const currentTool = state.tool;
    
        if (currentTool === 'image') {
            if (imageUploadData) {
                newDrawing = {
                    ...base,
                    type: 'rect', // It's a rectangle
                    startX: point.x, startY: point.y,
                    x: point.x, y: point.y, w: 0, h: 0,
                    borderRadius: 0,
                    fillType: 'image', // With an image fill
                    fillImage: imageUploadData.url,
                };
            } else {
                // Fallback in case user gets into this state without an image
                fileInputRef.current?.click();
                return;
            }
        } else {
            switch (currentTool) {
                case 'rect':
                    newDrawing = { ...base, type: 'rect', startX: point.x, startY: point.y, x: point.x, y: point.y, w: 0, h: 0, borderRadius: 0 };
                    break;
                case 'ellipse':
                    newDrawing = { ...base, type: 'ellipse', startX: point.x, startY: point.y, cx: point.x, cy: point.y, rx: 0, ry: 0 };
                    break;
                case 'line':
                    newDrawing = { ...base, type: 'line', x1: point.x, y1: point.y, x2: point.x, y2: point.y, fill: 'none' };
                    break;
                case 'text':
                    const textEl = {
                        id,
                        type: 'text',
                        x: point.x,
                        y: point.y,
                        text: state.text || 'Click to edit text',
                        fill: state.fill,
                        fontSize: state.fontSize,
                        fontWeight: state.textBold ? 'bold' : 'normal',
                        fontStyle: state.textItalic ? 'italic' : 'normal',
                        textDecoration: state.textUnderline ? 'underline' : 'none',
                        opacity: state.opacity,
                    };
                    setState(prev => ({
                        ...prev,
                        elements: [...prev.elements, textEl],
                        selection: id
                    }));
                    setEditingTextElement(textEl);
                    pushHistory();
                    return;
                default:
                    return;
            }
        }
        setDrawing(newDrawing);
    };
    
    const handleMouseMove = (e) => {
        if (!activeCanvas) return;
        if (state.panning && mouseDown) {
            e.preventDefault();
            updateState({
                panX: state.panX + e.movementX,
                panY: state.panY + e.movementY
            });
            return;
        }
    
        if (!mouseDown) return;
        const point = getMouse(e);
    
        if (state.resizeHandle && state.selection) {
            setState(prev => ({
                ...prev,
                elements: prev.elements.map(elem => {
                    if (elem.id !== state.selection) return elem;
                    const bbox = getBbox(elem);
                    let newElem = { ...elem };
                    switch (state.resizeHandle) {
                        case 'nw': newElem = handleResizeNW(newElem, point, bbox); break;
                        case 'ne': newElem = handleResizeNE(newElem, point, bbox); break;
                        case 'sw': newElem = handleResizeSW(newElem, point, bbox); break;
                        case 'se': newElem = handleResizeSE(newElem, point, bbox); break;
                        case 'n': newElem = handleResizeN(newElem, point, bbox); break;
                        case 'e': newElem = handleResizeE(newElem, point, bbox); break;
                        case 's': newElem = handleResizeS(newElem, point, bbox); break;
                        case 'w': newElem = handleResizeW(newElem, point, bbox); break;
                    }
                    return newElem;
                })
            }));
            return;
        }
    
        if (state.isDragging && state.selection) {
            const el = state.elements.find(x => x.id === state.selection);
            if (!el) return;
            const newX = point.x - state.dragOffset.x;
            const newY = point.y - state.dragOffset.y;
            setState(prev => ({
                ...prev,
                elements: prev.elements.map(elem => {
                    if (elem.id !== state.selection) return elem;
                    if (elem.type === 'rect' || elem.type === 'text') {
                        return { ...elem, x: newX, y: newY };
                    } else if (elem.type === 'ellipse') {
                        return { ...elem, cx: newX + elem.rx, cy: newY + elem.ry };
                    } else if (elem.type === 'line') {
                        const bbox = getBbox(el);
                        const dx = newX - bbox.x;
                        const dy = newY - bbox.y;
                        return { ...elem, x1: el.x1 + dx, y1: el.y1 + dy, x2: el.x2 + dx, y2: el.y2 + dy };
                    } else if (elem.type === 'path') {
                        const bbox = getBbox(el);
                        const dx = newX - bbox.x;
                        const dy = newY - bbox.y;
                        return {
                            ...elem,
                            points: el.points.map(p => ({ x: p.x + dx, y: p.y + dy }))
                        }
                    }
                    return elem;
                })
            }));
            return;
        }
    
        if (!drawing) return;
        const updatedDrawing = { ...drawing };
        switch (drawing.type) {
            case 'rect': {
                const startX = drawing.startX;
                const startY = drawing.startY;
                let width = point.x - startX;
                let height = point.y - startY;
                if (e.shiftKey) {
                    if (drawing.fillType === 'image' && imageUploadData?.aspectRatio) {
                        const signW = Math.sign(width) || 1;
                        const signH = Math.sign(height) || 1;
                        const absWidth = Math.abs(width);
                        const absHeight = Math.abs(height);
                        if (absWidth / imageUploadData.aspectRatio > absHeight) {
                            height = (absWidth / imageUploadData.aspectRatio) * signH;
                        } else {
                            width = (absHeight * imageUploadData.aspectRatio) * signW;
                        }
                    } else {
                        const size = Math.max(Math.abs(width), Math.abs(height));
                        width = size * Math.sign(width);
                        height = size * Math.sign(height);
                    }
                }
                updatedDrawing.w = Math.abs(width);
                updatedDrawing.h = Math.abs(height);
                updatedDrawing.x = width < 0 ? startX + width : startX;
                updatedDrawing.y = height < 0 ? startY + height : startY;
                break;
            }
            case 'ellipse': {
                const startX = drawing.startX;
                const startY = drawing.startY;
                let rx = Math.abs(point.x - startX) / 2;
                let ry = Math.abs(point.y - startY) / 2;
                if (e.shiftKey) {
                    rx = ry = Math.max(rx, ry);
                }
                updatedDrawing.cx = startX + (point.x - startX) / 2;
                updatedDrawing.cy = startY + (point.y - startY) / 2;
                updatedDrawing.rx = rx;
                updatedDrawing.ry = ry;
                break;
            }
            case 'line': {
                if (e.shiftKey) {
                    const dx = point.x - drawing.x1;
                    const dy = point.y - drawing.y1;
                    const angle = Math.atan2(dy, dx);
                    const snapAngle = Math.round(angle / (Math.PI / 4)) * (Math.PI / 4);
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    updatedDrawing.x2 = drawing.x1 + distance * Math.cos(snapAngle);
                    updatedDrawing.y2 = drawing.y1 + distance * Math.sin(snapAngle);
                } else {
                    updatedDrawing.x2 = point.x;
                    updatedDrawing.y2 = point.y;
                }
                break;
            }
        }
        setDrawing(updatedDrawing);
    };

    const handleResizeNW = (elem, point, bbox) => {
        const newWidth = bbox.x + bbox.w - point.x;
        const newHeight = bbox.y + bbox.h - point.y;
        if (newWidth <= 1 || newHeight <= 1) return elem;
        if (elem.type === 'rect') return { ...elem, x: point.x, y: point.y, w: newWidth, h: newHeight };
        if (elem.type === 'ellipse') return { ...elem, cx: point.x + newWidth / 2, cy: point.y + newHeight / 2, rx: newWidth / 2, ry: newHeight / 2 };
        if (elem.type === 'text') {
            const scale = newHeight / bbox.h;
            const newFontSize = Math.max(1, elem.fontSize * scale);
            return { ...elem, fontSize: newFontSize, x: point.x, y: point.y + newFontSize };
        }
        return elem;
    };
    const handleResizeNE = (elem, point, bbox) => {
        const newWidth = point.x - bbox.x;
        const newHeight = bbox.y + bbox.h - point.y;
        if (newWidth <= 1 || newHeight <= 1) return elem;
        if (elem.type === 'rect') return { ...elem, y: point.y, w: newWidth, h: newHeight };
        if (elem.type === 'ellipse') return { ...elem, cx: bbox.x + newWidth / 2, cy: point.y + newHeight / 2, rx: newWidth / 2, ry: newHeight / 2 };
        if (elem.type === 'text') {
            const scale = newHeight / bbox.h;
            const newFontSize = Math.max(1, elem.fontSize * scale);
            return { ...elem, fontSize: newFontSize, y: point.y + newFontSize };
        }
        return elem;
    };
    const handleResizeSW = (elem, point, bbox) => {
        const newWidth = bbox.x + bbox.w - point.x;
        const newHeight = point.y - bbox.y;
        if (newWidth <= 1 || newHeight <= 1) return elem;
        if (elem.type === 'rect') return { ...elem, x: point.x, w: newWidth, h: newHeight };
        if (elem.type === 'ellipse') return { ...elem, cx: point.x + newWidth / 2, cy: bbox.y + newHeight / 2, rx: newWidth / 2, ry: newHeight / 2 };
        if (elem.type === 'text') {
            const scale = newHeight / bbox.h;
            const newFontSize = Math.max(1, elem.fontSize * scale);
            return { ...elem, fontSize: newFontSize, x: point.x, y: bbox.y + newFontSize };
        }
        return elem;
    };
    const handleResizeSE = (elem, point, bbox) => {
        const newWidth = point.x - bbox.x;
        const newHeight = point.y - bbox.y;
        if (newWidth <= 1 || newHeight <= 1) return elem;
        if (elem.type === 'rect') return { ...elem, w: newWidth, h: newHeight };
        if (elem.type === 'ellipse') return { ...elem, cx: bbox.x + newWidth / 2, cy: bbox.y + newHeight / 2, rx: newWidth / 2, ry: newHeight / 2 };
        if (elem.type === 'text') {
            const scale = newHeight / bbox.h;
            const newFontSize = Math.max(1, elem.fontSize * scale);
            return { ...elem, fontSize: newFontSize, y: bbox.y + newFontSize };
        }
        return elem;
    };
    const handleResizeN = (elem, point, bbox) => {
        const newHeight = bbox.y + bbox.h - point.y;
        if (newHeight <= 1) return elem;
        if (elem.type === 'rect') return { ...elem, y: point.y, h: newHeight };
        if (elem.type === 'ellipse') return { ...elem, cy: point.y + newHeight / 2, ry: newHeight / 2 };
        if (elem.type === 'text') {
            const scale = newHeight / bbox.h;
            const newFontSize = Math.max(1, elem.fontSize * scale);
            return { ...elem, fontSize: newFontSize, y: point.y + newFontSize };
        }
        return elem;
    };
    const handleResizeE = (elem, point, bbox) => {
        const newWidth = point.x - bbox.x;
        if (newWidth <= 1) return elem;
        if (elem.type === 'rect') return { ...elem, w: newWidth };
        if (elem.type === 'ellipse') return { ...elem, cx: bbox.x + newWidth / 2, rx: newWidth / 2 };
        if (elem.type === 'text') {
            const scale = newWidth / bbox.w;
            const newFontSize = Math.max(1, elem.fontSize * scale);
            return { ...elem, fontSize: newFontSize, y: bbox.y + newFontSize };
        }
        return elem;
    };
    const handleResizeS = (elem, point, bbox) => {
        const newHeight = point.y - bbox.y;
        if (newHeight <= 1) return elem;
        if (elem.type === 'rect') return { ...elem, h: newHeight };
        if (elem.type === 'ellipse') return { ...elem, cy: bbox.y + newHeight / 2, ry: newHeight / 2 };
        if (elem.type === 'text') {
            const scale = newHeight / bbox.h;
            const newFontSize = Math.max(1, elem.fontSize * scale);
            return { ...elem, fontSize: newFontSize, y: bbox.y + newFontSize };
        }
        return elem;
    };
    const handleResizeW = (elem, point, bbox) => {
        const newWidth = bbox.x + bbox.w - point.x;
        if (newWidth <= 1) return elem;
        if (elem.type === 'rect') return { ...elem, x: point.x, w: newWidth };
        if (elem.type === 'ellipse') return { ...elem, cx: point.x + newWidth / 2, rx: newWidth / 2 };
        if (elem.type === 'text') {
            const scale = newWidth / bbox.w;
            const newFontSize = Math.max(1, elem.fontSize * scale);
            return { ...elem, fontSize: newFontSize, x: point.x, y: bbox.y + newFontSize };
        }
        return elem;
    };

    const handleMouseUp = () => {
        const currentTool = state.tool;
        setMouseDown(false);

        if (state.isDragging || state.resizeHandle) {
            updateState({
                isDragging: false,
                resizeHandle: null,
                dragOffset: { x: 0, y: 0 }
            });
            pushHistory();
            return;
        }
    
        if (drawing) {
            const finalShape = finalizeShape(drawing);
            if (finalShape) {
                setState(prev => ({
                    ...prev,
                    elements: [...prev.elements, finalShape],
                    selection: finalShape.id
                }));
                pushHistory();
            }
            setDrawing(null);
            if (currentTool === 'image') {
                updateState({ tool: 'select' });
                setImageUploadData(null);
            }
        }
    };
    
    const finalizeShape = (shape) => {
        const minSize = 2;
        switch (shape.type) {
            case 'rect':
                return (shape.w < minSize || shape.h < minSize) ? null : shape;
            case 'ellipse':
                return (shape.rx < minSize || shape.ry < minSize) ? null : shape;
            case 'line': {
                const dist = Math.sqrt(Math.pow(shape.x2 - shape.x1, 2) + Math.pow(shape.y2 - shape.y1, 2));
                return dist < minSize ? null : { ...shape, fill: 'none' };
            }
            default:
                return shape;
        }
    };
    
    const handleDoubleClick = (e) => {
        if (state.tool === 'path' && isPathDrawing && pathPoints.length > 1) {
            const path = {
                id: uid(),
                type: 'path',
                points: pathPoints,
                stroke: state.stroke,
                strokeW: state.strokeW,
                fill: 'none',
                opacity: state.opacity
            };
            setState(prev => ({
                ...prev,
                elements: [...prev.elements, path],
                selection: path.id
            }));
            setIsPathDrawing(false);
            setPathPoints([]);
            pushHistory();
            updateState({ tool: 'select' });
            return;
        }
    
        const hit = hitTest(getMouse(e));
        if (!hit) return;
    
        if (hit.element.type === 'text') {
            updateState({ selection: hit.id });
            setEditingTextElement(hit.element);
        }
    };
    
    const saveTextEdit = (newText) => {
        const elementId = textEditor?.id || editingTextElement?.id;
        if (elementId) {
            setState(prev => ({
                ...prev,
                elements: prev.elements.map(el =>
                    el.id === elementId ? { ...el, text: newText } : el
                )
            }));
            pushHistory();
        }
        setTextEditor(null);
        setEditingTextElement(null);
    };

    const deleteSelected = () => {
        if (!state.selection) return;
        setState(prev => ({
            ...prev,
            elements: prev.elements.filter(x => x.id !== state.selection),
            selection: null
        }));
        pushHistory();
    };

    const handleElementPropertyChange = (prop) => (e) => {
        if (!state.selection) return;
        const value = Number(e.target.value);
        setState(prev => ({
            ...prev,
            elements: prev.elements.map(el =>
                el.id === prev.selection ? { ...el, [prop]: value } : el
            )
        }));
    };
    
    const applyAnimation = () => {
        if (!state.selection || !animationSettings.type) return;
        setState(prev => ({
            ...prev,
            elements: prev.elements.map(el =>
                el.id === state.selection
                    ? { ...el, animation: { ...animationSettings } }
                    : el
            )
        }));
        pushHistory();
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                const aspectRatio = img.width / img.height;
                const url = event.target.result;
                setImageUploadData({ url, aspectRatio });
                updateState({ tool: 'image' });
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
        e.target.value = '';
    };

    const handleFillImageUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            const url = event.target.result;
            updateState({ fillImage: url, fillType: 'image' });
        };
        reader.readAsDataURL(file);
        e.target.value = '';
    };

    const handleBgImageUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            updateState({ canvasBgImage: event.target.result });
            pushHistory();
        };
        reader.readAsDataURL(file);
        e.target.value = '';
    };

    const removeBgImage = () => {
        updateState({ canvasBgImage: null });
        pushHistory();
    };

    const getFillValue = (shape) => {
        if (shape.fillType === 'gradient') {
            return `url(#grad_${shape.id})`;
        }
        if (shape.fillType === 'image' && shape.fillImage) {
            return `url(#img_${shape.id})`;
        }
        return shape.fill;
    };
    
    const renderShape = (shape) => {
        const animationClass = shape.animation?.type ? `animate-${shape.animation.type}` : '';
        const style = shape.animation ? {
            animationDuration: `${shape.animation.duration}s`,
            animationDelay: `${shape.animation.delay}s`
        } : {};
    
        switch (shape.type) {
            case 'rect':
                return <rect key={shape.id} x={shape.x} y={shape.y} width={shape.w} height={shape.h} rx={shape.borderRadius} ry={shape.borderRadius} fill={getFillValue(shape)} stroke={shape.stroke} strokeWidth={shape.strokeW} opacity={shape.opacity} className={animationClass} style={style} data-id={shape.id} />;
            case 'ellipse':
                return <ellipse key={shape.id} cx={shape.cx} cy={shape.cy} rx={shape.rx} ry={shape.ry} fill={getFillValue(shape)} stroke={shape.stroke} strokeWidth={shape.strokeW} opacity={shape.opacity} className={animationClass} style={style} data-id={shape.id} />;
            case 'line':
                return <line key={shape.id} x1={shape.x1} y1={shape.y1} x2={shape.x2} y2={shape.y2} stroke={shape.stroke} strokeWidth={shape.strokeW} opacity={shape.opacity} className={animationClass} style={style} data-id={shape.id} />;
            case 'text':
                return <text key={shape.id} x={shape.x} y={shape.y} fill={shape.fill} fontSize={shape.fontSize} fontFamily="Inter, system-ui" fontWeight={shape.fontWeight} fontStyle={shape.fontStyle} textDecoration={shape.textDecoration} opacity={shape.opacity} className={animationClass} style={style} data-id={shape.id}>{shape.text}</text>;
            case 'path':
                const d = shape.points.reduce((acc, p, i) => i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`, '');
                return <path key={shape.id} d={d} fill="none" stroke={shape.stroke} strokeWidth={shape.strokeW} opacity={shape.opacity} className={animationClass} style={style} data-id={shape.id} />;
            default:
                return null;
        }
    };

    const exportPNG = () => {
        if (!canvasRef.current || !activeCanvas) return;
        const svg = canvasRef.current;
        const svgData = new XMLSerializer().serializeToString(svg);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
    
        const isRotated = state.canvasRotation === 90 || state.canvasRotation === 270;
        canvas.width = (isRotated ? activeCanvas.height : activeCanvas.width) * 2;
        canvas.height = (isRotated ? activeCanvas.width : activeCanvas.height) * 2;
    
        img.onload = () => {
            ctx.fillStyle = state.canvasBg;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
    
            const drawFinalImage = () => {
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                const link = document.createElement('a');
                link.download = `${activeCanvas.name}-${Date.now()}.png`;
                link.href = canvas.toDataURL();
                link.click();
            };
    
            if (state.canvasBgImage) {
                const bgImg = new Image();
                bgImg.onload = () => {
                    ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);
                    drawFinalImage();
                };
                bgImg.src = state.canvasBgImage;
            } else {
                drawFinalImage();
            }
        };
        img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
    };

    const clearCanvas = () => {
        setState(prev => ({
            ...prev,
            elements: [],
            selection: null
        }));
        pushHistory();
    };

    const generateKeyframes = (type) => {
        switch (type) {
            case 'fadeIn': return 'from { opacity: 0; } to { opacity: 1; }';
            case 'slideUp': return 'from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; }';
            case 'slideDown': return 'from { transform: translateY(-20px); opacity: 0; } to { transform: translateY(0); opacity: 1; }';
            case 'slideLeft': return 'from { transform: translateX(20px); opacity: 0; } to { transform: translateX(0); opacity: 1; }';
            case 'slideRight': return 'from { transform: translateX(-20px); opacity: 0; } to { transform: translateX(0); opacity: 1; }';
            case 'zoomIn': return 'from { transform: scale(0.8); opacity: 0; } to { transform: scale(1); opacity: 1; }';
            case 'zoomOut': return 'from { transform: scale(1.2); opacity: 0; } to { transform: scale(1); opacity: 1; }';
            case 'bounce': return '0%, 20%, 50%, 80%, 100% { transform: translateY(0); } 40% { transform: translateY(-30px); } 60% { transform: translateY(-15px); }';
            case 'pulse': return '0% { transform: scale(1); } 50% { transform: scale(1.05); } 100% { transform: scale(1); }';
            case 'shake': return '0%, 100% { transform: translateX(0); } 10%, 30%, 50%, 70%, 90% { transform: translateX(-10px); } 20%, 40%, 60%, 80% { transform: translateX(10px); }';
            case 'rotate': return 'from { transform: rotate(0deg); } to { transform: rotate(360deg); }';
            case 'flip': return '0% { transform: rotateY(0); } 50% { transform: rotateY(180deg); } 100% { transform: rotateY(360deg); }';
            default: return '';
        }
    };

    const generateHTMLCode = () => {
        if (!activeCanvas) return '<!-- Create a canvas to see the generated HTML code -->';
        let elementsHTML = state.elements.map(el => {
            return `        <div id="${el.id}" class="element ${el.type}">${el.type === 'text' ? el.text : ''}</div>`;
        }).join('\n');

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${activeCanvas.name}</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <div class="canvas-container">
${elementsHTML}
    </div>
    <script src="script.js"></script>
</body>
</html>`;
    };

    const generateCSSCode = () => {
        if (!activeCanvas) return '/* Create a canvas to see the generated CSS code */';
        
        let bodyCss = `body {
    margin: 0;
    padding: 0;
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    font-family: 'Inter', system-ui, -apple-system, sans-serif;
}
`;

        let canvasCss = `.canvas-container {
    width: ${activeCanvas.width}px;
    height: ${activeCanvas.height}px;
    position: relative;
    background-color: ${state.canvasBg};
    ${state.canvasBgImage ? `background-image: url(${state.canvasBgImage});\n    background-size: cover;` : ''}
    transform: rotate(${state.canvasRotation}deg);
    overflow: hidden;
}
`;
        
        let elementsCss = `.element {
    position: absolute;
    box-sizing: border-box;
}
`;

        const animationTypes = new Set();

        state.elements.forEach(el => {
            let style = '';
            let backgroundStyle = '';

            switch (el.fillType) {
                case 'gradient':
                    backgroundStyle = `background-image: linear-gradient(${el.fillGradient.angle}deg, ${el.fillGradient.start}, ${el.fillGradient.end});`;
                    break;
                case 'image':
                    backgroundStyle = el.fillImage ? `background-image: url(${el.fillImage});\n    background-size: cover;\n    background-position: center;` : `background-color: ${el.fill};`;
                    break;
                default:
                    backgroundStyle = `background-color: ${el.fill};`;
            }

            switch (el.type) {
                case 'rect':
                    style = `left: ${el.x}px;\n    top: ${el.y}px;\n    width: ${el.w}px;\n    height: ${el.h}px;\n    ${backgroundStyle}\n    border: ${el.strokeW}px solid ${el.stroke};\n    border-radius: ${el.borderRadius || 0}px;`;
                    break;
                case 'ellipse':
                    style = `left: ${el.cx - el.rx}px;\n    top: ${el.cy - el.ry}px;\n    width: ${el.rx * 2}px;\n    height: ${el.ry * 2}px;\n    ${backgroundStyle}\n    border: ${el.strokeW}px solid ${el.stroke};\n    border-radius: 50%;`;
                    break;
                case 'line':
                    const angle = Math.atan2(el.y2 - el.y1, el.x2 - el.x1) * 180 / Math.PI;
                    const length = Math.sqrt(Math.pow(el.x2 - el.x1, 2) + Math.pow(el.y2 - el.y1, 2));
                    style = `left: ${el.x1}px;\n    top: ${el.y1}px;\n    width: ${length}px;\n    height: ${el.strokeW}px;\n    background-color: ${el.stroke};\n    transform: rotate(${angle}deg);\n    transform-origin: 0 0;`;
                    break;
                case 'text':
                    style = `left: ${el.x}px;\n    top: ${el.y - el.fontSize}px;\n    color: ${el.fill};\n    font-size: ${el.fontSize}px;\n    font-weight: ${el.fontWeight};\n    font-style: ${el.fontStyle};\n    text-decoration: ${el.textDecoration};`;
                    break;
                default:
                    break;
            }

            const animationStyle = el.animation ? `animation: ${el.animation.type} ${el.animation.duration}s ${el.animation.delay}s both;` : '';
            if (el.animation) animationTypes.add(el.animation.type);
            
            elementsCss += `\n#${el.id} {
    ${style}
    opacity: ${el.opacity ?? 1};
    ${animationStyle}
}
`;
        });

        let keyframesCss = '';
        if (animationTypes.size > 0) {
            keyframesCss += `/* --- Animation Keyframes --- */\n`;
            Array.from(animationTypes).forEach(type => {
                keyframesCss += `@keyframes ${type} {\n    ${generateKeyframes(type)}\n}\n\n`;
            });
        }

        return bodyCss + canvasCss + elementsCss + keyframesCss;
    };

    const generateJSCode = () => {
        if (!activeCanvas) return '// Create a canvas to see the generated JavaScript code';
        
        return `// script.js
document.addEventListener('DOMContentLoaded', () => {
    console.log('Canvas elements loaded and ready.');

    // You can add interactivity here. For example:
    // const myElement = document.getElementById('${state.elements[0]?.id || 'element-id'}');
    // if (myElement) {
    //     myElement.addEventListener('click', () => {
    //         alert('You clicked an element!');
    //     });
    // }
});
`;
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
    };

    useEffect(() => {
        if (editingTextElement && textEditRef.current) {
            textEditRef.current.focus();
            textEditRef.current.select();
        }
    }, [editingTextElement]);

    const selectedElement = state.selection ? state.elements.find(el => el.id === state.selection) : null;
    
    const renderCode = () => {
        switch (codeOutputType) {
            case 'html': return generateHTMLCode();
            case 'css': return generateCSSCode();
            case 'js': return generateJSCode();
            default: return '';
        }
    };

    const canvasStyle = activeCanvas ? {
        width: activeCanvas.width,
        height: activeCanvas.height,
        backgroundColor: state.canvasBg,
        transform: `rotate(${state.canvasRotation}deg)`,
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.1)',
        backgroundImage: state.canvasBgImage ? `url(${state.canvasBgImage})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
    } : {};
    
    return (
        <div className="h-screen bg-slate-900 text-white flex flex-col overflow-hidden">
            <style jsx>{`
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
                @keyframes slideDown { from { transform: translateY(-20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
                @keyframes slideLeft { from { transform: translateX(20px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
                @keyframes slideRight { from { transform: translateX(-20px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
                @keyframes zoomIn { from { transform: scale(0.8); opacity: 0; } to { transform: scale(1); opacity: 1; } }
                @keyframes zoomOut { from { transform: scale(1.2); opacity: 0; } to { transform: scale(1); opacity: 1; } }
                @keyframes bounce { 0%, 20%, 50%, 80%, 100% { transform: translateY(0); } 40% { transform: translateY(-30px); } 60% { transform: translateY(-15px); } }
                @keyframes pulse { 0% { transform: scale(1); } 50% { transform: scale(1.05); } 100% { transform: scale(1); } }
                @keyframes shake { 0%, 100% { transform: translateX(0); } 10%, 30%, 50%, 70%, 90% { transform: translateX(-10px); } 20%, 40%, 60%, 80% { transform: translateX(10px); } }
                @keyframes rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                @keyframes flip { 0% { transform: rotateY(0); } 50% { transform: rotateY(180deg); } 100% { transform: rotateY(360deg); } }
                .animate-fadeIn { animation: fadeIn 1s ease-out; }
                .animate-slideUp { animation: slideUp 0.5s ease-out; }
                .animate-slideDown { animation: slideDown 0.5s ease-out; }
                .animate-slideLeft { animation: slideLeft 0.5s ease-out; }
                .animate-slideRight { animation: slideRight 0.5s ease-out; }
                .animate-zoomIn { animation: zoomIn 0.5s ease-out; }
                .animate-zoomOut { animation: zoomOut 0.5s ease-out; }
                .animate-bounce { animation: bounce 2s infinite; }
                .animate-pulse { animation: pulse 2s infinite; }
                .animate-shake { animation: shake 0.5s ease-in-out; }
                .animate-rotate { animation: rotate 2s linear infinite; }
                .animate-flip { animation: flip 1s ease-in-out; }
                .canvas-scroll::-webkit-scrollbar { width: 8px; height: 8px; }
                .canvas-scroll::-webkit-scrollbar-track { background: rgba(15, 23, 42, 0.5); }
                .canvas-scroll::-webkit-scrollbar-thumb { background: rgba(71, 85, 105, 0.8); border-radius: 4px; }
                .canvas-scroll::-webkit-scrollbar-thumb:hover { background: rgba(100, 116, 139, 0.8); }
                .resize-handle { fill: #3b82f6; stroke: white; stroke-width: 2; }
                .resize-handle-nw, .resize-handle-se { cursor: nwse-resize; }
                .resize-handle-ne, .resize-handle-sw { cursor: nesw-resize; }
                .resize-handle-n, .resize-handle-s { cursor: ns-resize; }
                .resize-handle-e, .resize-handle-w { cursor: ew-resize; }
            `}</style>

            <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
            <input type="file" ref={bgFileInputRef} onChange={handleBgImageUpload} accept="image/*" className="hidden" />
            <input type="file" ref={fillImageInputRef} onChange={handleFillImageUpload} accept="image/*" className="hidden" />

            <div className="bg-slate-800 border-b border-slate-700 p-3 flex items-center gap-4">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full animate-pulse"></div>
                    <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Mini-Figma Pro</h1>
                </div>

                <div className="relative">
                    <button onClick={() => setShowCanvasDropdown(!showCanvasDropdown)} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg flex items-center gap-2 transition-all duration-200">
                        <FileText size={16} />
                        {activeCanvas ? activeCanvas.name : 'Select Canvas'}
                        <DropdownIcon size={14} />
                    </button>
                    {showCanvasDropdown && (
                        <div className="absolute top-full left-0 mt-2 w-72 bg-slate-800 border border-slate-600 rounded-xl shadow-2xl z-50 animate-slideDown">
                            <div className="p-3 border-b border-slate-700">
                                <h3 className="text-sm font-semibold text-gray-300 mb-2">Create New Canvas</h3>
                                <div className="grid grid-cols-2 gap-2">
                                    {canvasPresets.map(preset => (
                                        <button key={preset.id} onClick={() => createCanvas(preset)} className="p-2 text-left bg-slate-700 hover:bg-slate-600 rounded-lg transition-all duration-200 text-sm">
                                            <div className="font-medium">{preset.name}</div>
                                            <div className="text-xs text-gray-400">{preset.width} × {preset.height}</div>
                                        </button>
                                    ))}
                                </div>
                                <div className="mt-3 space-y-2">
                                    <h4 className="text-sm font-medium">Custom Size</h4>
                                    <div className="flex gap-2">
                                        <input type="number" placeholder="W" value={customCanvasSize.width} onChange={(e) => setCustomCanvasSize(p => ({...p, width: Number(e.target.value)}))} className="w-full p-2 rounded-md bg-slate-700 border border-slate-600 text-xs" />
                                        <input type="number" placeholder="H" value={customCanvasSize.height} onChange={(e) => setCustomCanvasSize(p => ({...p, height: Number(e.target.value)}))} className="w-full p-2 rounded-md bg-slate-700 border border-slate-600 text-xs" />
                                    </div>
                                    <button onClick={() => createCanvas({ id: 'custom', name: 'Custom', ...customCanvasSize })} className="w-full p-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors text-sm font-semibold">Create Custom Canvas</button>
                                </div>
                            </div>
                            {canvases.length > 0 && (
                                <div className="p-3">
                                    <h3 className="text-sm font-semibold text-gray-300 mb-2">Recent Canvases</h3>
                                    <div className="space-y-1">
                                        {canvases.map(canvas => (
                                            <button key={canvas.id} onClick={() => switchCanvas(canvas)} className={`w-full p-2 text-left rounded-lg transition-all duration-200 ${activeCanvas?.id === canvas.id ? 'bg-blue-600 text-white' : 'bg-slate-700 hover:bg-slate-600'}`}>
                                                <div className="font-medium text-sm">{canvas.name}</div>
                                                <div className="text-xs text-gray-400">{canvas.width} × {canvas.height} • {canvas.elements?.length || 0} elements</div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {activeCanvas && (
                    <>
                        <div className="flex gap-1">
                            {tools.map(tool => {
                                const Icon = tool.icon;
                                return (
                                    <button
                                        key={tool.id}
                                        onClick={() => {
                                            if (tool.id === 'image') {
                                                fileInputRef.current?.click();
                                            } else {
                                                updateState({ tool: tool.id });
                                            }
                                        }}
                                        className={`p-2 rounded-lg transition-all duration-200 transform hover:scale-105 ${ state.tool === tool.id ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/25' : 'bg-slate-700 hover:bg-slate-600 text-gray-300'}`}
                                        title={`${tool.name} (Ctrl + ${tool.shortcut})`}
                                    >
                                        <Icon size={18} />
                                    </button>
                                );
                            })}
                        </div>
                        <div className="flex-1"></div>
                        <div className="flex items-center gap-2 bg-slate-700/50 rounded-lg p-1">
                            <button onClick={zoomOut} className="p-2 rounded-lg hover:bg-slate-600 transition-all duration-200" title="Zoom Out (Ctrl+-)"><ZoomOut size={16} /></button>
                            <div className="px-3 py-1 text-sm font-mono min-w-16 text-center">{Math.round(state.zoom * 100)}%</div>
                            <button onClick={zoomIn} className="p-2 rounded-lg hover:bg-slate-600 transition-all duration-200" title="Zoom In (Ctrl++)"><ZoomIn size={16} /></button>
                            <div className="w-px h-6 bg-slate-600 mx-1"></div>
                            <button onClick={fitToScreen} className="p-2 rounded-lg hover:bg-slate-600 transition-all duration-200" title="Fit to Screen"><Maximize2 size={16} /></button>
                            <button onClick={resetView} className="p-2 rounded-lg hover:bg-slate-600 transition-all duration-200" title="Reset View (Ctrl+0)"><Home size={16} /></button>
                            <button onClick={rotateCanvas} className="p-2 rounded-lg hover:bg-slate-600 transition-all duration-200" title="Rotate Canvas (J)"><RotateCw size={16} /></button>
                            <button onClick={() => updateState({ showGrid: !state.showGrid })} className={`p-2 rounded-lg transition-all duration-200 ${state.showGrid ? 'bg-blue-600 text-white' : 'hover:bg-slate-600'}`} title="Toggle Grid"><Grid size={16} /></button>
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={undo} disabled={state.historyIndex <= 0} className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200" title="Undo (Ctrl+Z)"><RotateCcw size={16} /></button>
                            <button onClick={redo} disabled={state.historyIndex >= state.history.length - 1} className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200" title="Redo (Ctrl+Shift+Z)"><RotateCw size={16} /></button>
                            <button onClick={exportPNG} className="p-2 px-4 rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 flex items-center gap-2 transition-all duration-200 transform hover:scale-105"><Download size={16} />Export PNG</button>
                            <button onClick={clearCanvas} className="p-2 rounded-lg bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 transition-all duration-200 transform hover:scale-105" title="Clear Canvas"><Trash2 size={16} /></button>
                        </div>
                    </>
                )}
            </div>

            <div className="flex flex-1 overflow-auto">
                {activeCanvas && propertyPanelOpen && (
                    <div className="w-80 bg-slate-800 border-r border-slate-700 flex flex-col overflow-hidden transition-all duration-300">
                        <div className="p-3 border-b border-slate-700 flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-gray-300 flex items-center gap-2"><Sliders size={16} />PROPERTIES</h3>
                            <button onClick={() => setPropertyPanelOpen(false)} className="p-1 rounded hover:bg-slate-700 transition-colors"><X size={16} /></button>
                        </div>
                        <div className="flex-1 overflow-auto canvas-scroll">
                            <div className="p-4 border-b border-slate-700">
                                <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2"><div className="w-2 h-2 bg-blue-500 rounded-full"></div>CANVAS</h3>
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs text-gray-400 mb-2">Width</label>
                                            <input type="number" value={activeCanvas.width} onChange={(e) => handleCanvasDimensionChange('width', Number(e.target.value))} onBlur={commitCanvasChanges} min="1" className="w-full p-2 rounded-lg bg-slate-700 border border-slate-600 text-white focus:border-blue-500 transition-colors duration-200" />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-gray-400 mb-2">Height</label>
                                            <input type="number" value={activeCanvas.height} onChange={(e) => handleCanvasDimensionChange('height', Number(e.target.value))} onBlur={commitCanvasChanges} min="1" className="w-full p-2 rounded-lg bg-slate-700 border border-slate-600 text-white focus:border-blue-500 transition-colors duration-200" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-400 mb-2">Background Color</label>
                                        <div className="relative">
                                            <input type="color" value={state.canvasBg} onChange={(e) => { updateState({ canvasBg: e.target.value }); pushHistory(); }} className="w-full h-10 rounded-lg border border-slate-600 bg-transparent cursor-pointer" />
                                            <div className="absolute inset-1 rounded-md pointer-events-none border-2 border-white/20" style={{ backgroundColor: state.canvasBg }}></div>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-400 mb-2">Background Image</label>
                                        <div className="flex gap-2">
                                            <button onClick={() => bgFileInputRef.current?.click()} className="flex-1 p-2 bg-slate-700 hover:bg-slate-600 rounded-lg flex items-center justify-center gap-2 transition-all duration-200"><Upload size={14} />Upload</button>
                                            {state.canvasBgImage && (<button onClick={removeBgImage} className="p-2 bg-red-700 hover:bg-red-600 rounded-lg transition-all duration-200" title="Remove background image"><X size={14} /></button>)}
                                        </div>
                                        {state.canvasBgImage && (<div className="mt-2 relative group"><img src={state.canvasBgImage} alt="Canvas background" className="w-full h-20 object-cover rounded-lg" /><div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-200 rounded-lg"><button onClick={removeBgImage} className="p-1 bg-red-600 rounded" title="Remove background image"><X size={14} /></button></div></div>)}
                                    </div>
                                </div>
                            </div>
                            
                            {selectedElement?.type === 'rect' && (
                                <div className="p-4 border-b border-slate-700">
                                    <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2"><Grip size={16} />RECTANGLE</h3>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-xs text-gray-400 mb-2">Corner Radius</label>
                                            <input type="range" value={selectedElement.borderRadius || 0} onChange={handleElementPropertyChange('borderRadius')} onMouseUp={pushHistory} min="0" max={Math.min(selectedElement.w, selectedElement.h) / 2} className="w-full mb-2" />
                                            <input type="number" value={selectedElement.borderRadius || 0} onChange={handleElementPropertyChange('borderRadius')} onBlur={pushHistory} min="0" max={Math.min(selectedElement.w, selectedElement.h) / 2} className="w-full p-2 rounded-lg bg-slate-700 border border-slate-600 text-white text-sm" />
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="p-4 border-b border-slate-700">
                                <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2"><Palette size={16} />STYLE</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs text-gray-400 mb-2">Fill Type</label>
                                        <div className="flex bg-slate-700 rounded-md p-1">
                                            <button onClick={() => updateState({ fillType: 'solid' })} className={`flex-1 px-2 py-1 text-xs rounded-md transition-all duration-200 ${state.fillType === 'solid' ? 'bg-blue-600 text-white' : 'hover:bg-slate-600'}`}>Solid</button>
                                            <button onClick={() => updateState({ fillType: 'gradient' })} className={`flex-1 px-2 py-1 text-xs rounded-md transition-all duration-200 ${state.fillType === 'gradient' ? 'bg-blue-600 text-white' : 'hover:bg-slate-600'}`}>Gradient</button>
                                            <button onClick={() => updateState({ fillType: 'image' })} className={`flex-1 px-2 py-1 text-xs rounded-md transition-all duration-200 ${state.fillType === 'image' ? 'bg-blue-600 text-white' : 'hover:bg-slate-600'}`}>Image</button>
                                        </div>
                                    </div>
                                    {state.fillType === 'solid' && (
                                        <div>
                                            <label className="block text-xs text-gray-400 mb-2">Fill Color</label>
                                            <input type="color" value={state.fill} onChange={(e) => updateState({ fill: e.target.value })} className="w-full h-10 p-1 rounded-lg border border-slate-600 bg-slate-700 cursor-pointer" />
                                        </div>
                                    )}
                                    {state.fillType === 'gradient' && (
                                        <div className="space-y-3 p-2 border border-slate-700 rounded-lg">
                                            <div className="grid grid-cols-2 gap-2">
                                                <div><label className="block text-xs text-gray-400 mb-1">Start</label><input type="color" value={state.fillGradient.start} onChange={(e) => updateState({ fillGradient: { ...state.fillGradient, start: e.target.value } })} className="w-full h-10 p-1 rounded-lg border border-slate-600 bg-slate-700" /></div>
                                                <div><label className="block text-xs text-gray-400 mb-1">End</label><input type="color" value={state.fillGradient.end} onChange={(e) => updateState({ fillGradient: { ...state.fillGradient, end: e.target.value } })} className="w-full h-10 p-1 rounded-lg border border-slate-600 bg-slate-700" /></div>
                                            </div>
                                            <div>
                                                <label className="block text-xs text-gray-400 mb-1">Angle ({state.fillGradient.angle}°)</label>
                                                <input type="range" value={state.fillGradient.angle} onChange={(e) => updateState({ fillGradient: { ...state.fillGradient, angle: Number(e.target.value) } })} min="0" max="360" className="w-full" />
                                            </div>
                                        </div>
                                    )}
                                    {state.fillType === 'image' && (
                                        <div>
                                            <label className="block text-xs text-gray-400 mb-2">Fill Image</label>
                                            <button onClick={() => fillImageInputRef.current?.click()} className="w-full p-2 bg-slate-700 hover:bg-slate-600 rounded-lg flex items-center justify-center gap-2 transition-all duration-200"><Upload size={14} /> Upload Image</button>
                                            {state.fillImage && <img src={state.fillImage} className="w-full h-20 object-cover rounded-lg mt-2" alt="fill preview" />}
                                        </div>
                                    )}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs text-gray-400 mb-2">Stroke</label>
                                            <div className="relative"><input type="color" value={state.stroke} onChange={(e) => updateState({ stroke: e.target.value })} className="w-full h-10 rounded-lg border border-slate-600 bg-transparent cursor-pointer" /><div className="absolute inset-1 rounded-md pointer-events-none border-2 border-white/20" style={{ backgroundColor: state.stroke }}></div></div>
                                        </div>
                                        <div>
                                            <label className="block text-xs text-gray-400 mb-2">Stroke Width</label>
                                            <input type="number" value={state.strokeW} onChange={(e) => updateState({ strokeW: Number(e.target.value) })} min="0" max="50" className="w-full p-2 rounded-lg bg-slate-700 border border-slate-600 text-white text-sm" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-400 mb-2">Opacity ({Math.round(state.opacity * 100)}%)</label>
                                        <input type="range" value={state.opacity} onChange={(e) => updateState({ opacity: Number(e.target.value) })} min="0" max="1" step="0.01" className="w-full" />
                                    </div>
                                </div>
                            </div>
                            
                            <div className="p-4 border-b border-slate-700">
                                <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2"><Type size={16} />TEXT</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs text-gray-400 mb-2">Content</label>
                                        <input type="text" value={state.text} onChange={(e) => updateState({ text: e.target.value })} placeholder="Enter text" className="w-full p-2 rounded-lg bg-slate-700 border border-slate-600 text-white focus:border-blue-500 transition-colors duration-200" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs text-gray-400 mb-2">Size</label>
                                            <input type="number" value={state.fontSize} onChange={(e) => updateState({ fontSize: Number(e.target.value) })} min="8" max="200" className="w-full p-2 rounded-lg bg-slate-700 border border-slate-600 text-white focus:border-blue-500 transition-colors duration-200" />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-gray-400 mb-2">Style</label>
                                            <div className="flex gap-1">
                                                {[{ key: 'textBold', icon: Bold }, { key: 'textItalic', icon: Italic }, { key: 'textUnderline', icon: Underline }].map(({ key, icon: Icon }) => (
                                                    <button key={key} onClick={() => updateState({ [key]: !state[key] })} className={`p-2 rounded transition-all duration-200 transform hover:scale-105 ${state[key] ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white' : 'bg-slate-700 hover:bg-slate-600'}`}><Icon size={14} /></button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 border-b border-slate-700">
                                <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2"><Play size={16} />ANIMATION</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs text-gray-400 mb-2">Type</label>
                                        <select value={animationSettings.type} onChange={(e) => setAnimationSettings(prev => ({ ...prev, type: e.target.value }))} className="w-full p-2 rounded-lg bg-slate-700 border border-slate-600 text-white focus:border-blue-500 transition-colors duration-200">
                                            {animations.map(anim => (<option key={anim.value} value={anim.value}>{anim.label}</option>))}
                                        </select>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs text-gray-400 mb-2">Duration (s)</label>
                                            <input type="number" value={animationSettings.duration} onChange={(e) => setAnimationSettings(prev => ({ ...prev, duration: Number(e.target.value) }))} min="0.1" max="10" step="0.1" className="w-full p-2 rounded-lg bg-slate-700 border border-slate-600 text-white focus:border-blue-500 transition-colors duration-200" />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-gray-400 mb-2">Delay (s)</label>
                                            <input type="number" value={animationSettings.delay} onChange={(e) => setAnimationSettings(prev => ({ ...prev, delay: Number(e.target.value) }))} min="0" max="10" step="0.1" className="w-full p-2 rounded-lg bg-slate-700 border border-slate-600 text-white focus:border-blue-500 transition-colors duration-200" />
                                        </div>
                                    </div>
                                    <button onClick={applyAnimation} disabled={!state.selection || !animationSettings.type} className="w-full p-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all duration-200 transform hover:scale-105 disabled:transform-none"><Play size={16} />Apply Animation</button>
                                </div>
                            </div>
                            <div className="flex-1 flex flex-col">
                                <div className="p-4 border-b border-slate-700">
                                    <h3 className="text-sm font-semibold text-gray-300 flex items-center gap-2"><Layers size={16} />LAYERS ({state.elements.length})</h3>
                                </div>
                                <div className="flex-1 overflow-auto">
                                    {[...state.elements].reverse().map((element, index) => {
                                        const isSelected = state.selection === element.id;
                                        return (
                                            <div key={element.id} onClick={() => updateState({ selection: element.id })} className={`p-3 border-b border-slate-700/50 cursor-pointer transition-all duration-200 group ${isSelected ? 'bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-l-4 border-l-blue-500' : 'hover:bg-slate-700/50'}`}>
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className="text-lg">
                                                            {element.type === 'rect' && (element.fillType === 'image' ? '🖼️' : '⬛')}
                                                            {element.type === 'ellipse' && '⭕'}
                                                            {element.type === 'line' && '📏'}
                                                            {element.type === 'text' && '🅣'}
                                                            {element.type === 'path' && '✏️'}
                                                        </div>
                                                        <div>
                                                            <div className="text-sm font-medium">{element.type} #{state.elements.length - index}</div>
                                                            {element.animation && (<div className="text-xs text-blue-400">{element.animation.type}</div>)}
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                                        <button onClick={(e) => { e.stopPropagation(); const currentIndex = state.elements.findIndex(el => el.id === element.id); if (currentIndex < state.elements.length - 1) { const newElements = [...state.elements];[newElements[currentIndex], newElements[currentIndex + 1]] = [newElements[currentIndex + 1], newElements[currentIndex]]; updateState({ elements: newElements }); pushHistory(); } }} className="p-1 rounded hover:bg-slate-600 transition-colors duration-200" title="Bring forward"><ChevronUp size={12} /></button>
                                                        <button onClick={(e) => { e.stopPropagation(); const currentIndex = state.elements.findIndex(el => el.id === element.id); if (currentIndex > 0) { const newElements = [...state.elements];[newElements[currentIndex], newElements[currentIndex - 1]] = [newElements[currentIndex - 1], newElements[currentIndex]]; updateState({ elements: newElements }); pushHistory(); } }} className="p-1 rounded hover:bg-slate-600 transition-colors duration-200" title="Send backward"><ChevronDown size={12} /></button>
                                                        <button onClick={(e) => { e.stopPropagation(); deleteSelected(); }} className="p-1 rounded hover:bg-red-600 transition-colors duration-200" title="Delete"><X size={12} /></button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {state.elements.length === 0 && (
                                        <div className="p-8 text-center text-gray-500"><Layers size={48} className="mx-auto mb-4 opacity-50" /><p className="font-medium">No layers yet</p><p className="text-sm">Start drawing to create elements</p></div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {!propertyPanelOpen && (<button onClick={() => setPropertyPanelOpen(true)} className="absolute left-0 top-1/2 z-10 mt-4 ml-2 p-2 bg-slate-800 rounded-r-lg border border-slate-700 border-l-0 shadow-md transition-all duration-200 hover:bg-slate-700"><Sliders size={16} /></button>)}
                
                <div className="flex-1 flex flex-col overflow-hidden">
                    {!activeCanvas ? (
                        <div className="flex-1 flex items-center justify-center bg-slate-900">
                            <div className="text-center space-y-6">
                                <div className="w-32 h-32 mx-auto bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full flex items-center justify-center border-2 border-blue-500/30"><FileText size={48} className="text-blue-400" /></div>
                                <div className="space-y-2">
                                    <h2 className="text-2xl font-bold text-white">Welcome to Mini-Figma Pro</h2>
                                    <p className="text-gray-400 max-w-md">Create stunning designs with our powerful vector editor. Choose a canvas size to get started.</p>
                                </div>
                                <button onClick={() => setShowCanvasDropdown(true)} className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 flex items-center gap-2 mx-auto"><Plus size={20} />Create New Canvas</button>
                            </div>
                        </div>
                    ) : (
                        <div ref={stageRef} className="flex-1 overflow-auto bg-slate-900 relative canvas-scroll" style={{ cursor: state.panning ? 'grabbing' : (state.tool === 'select' ? 'default' : 'crosshair') }} onWheel={(e) => { if (e.ctrlKey || e.metaKey) { e.preventDefault(); const delta = e.deltaY > 0 ? 0.9 : 1.1; const newZoom = Math.max(0.1, Math.min(5, state.zoom * delta)); updateState({ zoom: newZoom }); } }}>
                            <div className="relative" style={{ width: '100%', height: '100%', transform: `translate(${state.panX}px, ${state.panY}px) scale(${state.zoom})`, transformOrigin: '0 0' }}>
                                <div className="absolute rounded-2xl shadow-2xl overflow-hidden" style={canvasStyle}>
                                    {state.showGrid && (<div className="absolute inset-0 opacity-20" style={{ backgroundImage: `linear-gradient(rgba(59, 130, 246, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(59, 130, 246, 0.1) 1px, transparent 1px), linear-gradient(rgba(59, 130, 246, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(59, 130, 246, 0.05) 1px, transparent 1px)`, backgroundSize: '20px 20px, 20px 20px, 100px 100px, 100px 100px' }} />)}
                                    <svg ref={canvasRef} width={activeCanvas.width} height={activeCanvas.height} viewBox={`0 0 ${activeCanvas.width} ${activeCanvas.height}`} className="absolute inset-0 w-full h-full" onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onDoubleClick={handleDoubleClick}>
                                        <defs>
                                            {state.elements.map(el => {
                                                if (el.fillType === 'gradient') {
                                                    return (<linearGradient key={`grad_${el.id}`} id={`grad_${el.id}`} x1="0%" y1="0%" x2="100%" y2="0%" gradientTransform={`rotate(${el.fillGradient.angle || 0})`}><stop offset="0%" stopColor={el.fillGradient.start} /><stop offset="100%" stopColor={el.fillGradient.end} /></linearGradient>);
                                                }
                                                if (el.fillType === 'image' && el.fillImage) {
                                                    const bbox = getBbox(el);
                                                    return (<pattern key={`img_${el.id}`} id={`img_${el.id}`} patternUnits="userSpaceOnUse" x={bbox.x} y={bbox.y} width={bbox.w} height={bbox.h}><image href={el.fillImage} x="0" y="0" width={bbox.w} height={bbox.h} preserveAspectRatio="xMidYMid slice" /></pattern>);
                                                }
                                                return null;
                                            })}
                                        </defs>
                                        {state.elements.map(renderShape)}
                                        {drawing && renderShape({ ...drawing, fill: drawing.fill + '80', stroke: drawing.stroke + 'CC' })}
                                        {isPathDrawing && pathPoints.length > 0 && (<path d={pathPoints.reduce((acc, p, i) => i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`, '')} fill="none" stroke="#3b82f6" strokeWidth={2 / state.zoom} strokeDasharray="4 4" />)}
                                        {state.selection && (() => {
                                            const selectedEl = state.elements.find(x => x.id === state.selection);
                                            if (!selectedEl) return null;
                                            const bbox = getBbox(selectedEl);
                                            return (
                                                <g>
                                                    <rect x={bbox.x - 2} y={bbox.y - 2} width={bbox.w + 4} height={bbox.h + 4} fill="none" stroke="#3b82f6" strokeWidth={2 / state.zoom} strokeDasharray="4 4" className="animate-pulse" />
                                                    {[{ id: 'nw', x: bbox.x, y: bbox.y }, { id: 'ne', x: bbox.x + bbox.w, y: bbox.y }, { id: 'sw', x: bbox.x, y: bbox.y + bbox.h }, { id: 'se', x: bbox.x + bbox.w, y: bbox.y + bbox.h }, { id: 'n', x: bbox.x + bbox.w / 2, y: bbox.y }, { id: 'e', x: bbox.x + bbox.w, y: bbox.y + bbox.h / 2 }, { id: 's', x: bbox.x + bbox.w / 2, y: bbox.y + bbox.h }, { id: 'w', x: bbox.x, y: bbox.y + bbox.h / 2 }].map((handle) => (
                                                        <rect key={handle.id} x={handle.x - 5 / state.zoom} y={handle.y - 5 / state.zoom} width={10 / state.zoom} height={10 / state.zoom} className={`resize-handle resize-handle-${handle.id.substring(0, 2)}`} strokeWidth={2 / state.zoom} data-handle={handle.id} />
                                                    ))}
                                                </g>
                                            );
                                        })()}
                                    </svg>
                                    {(editingTextElement) && (
                                        <div className="absolute z-50 bg-slate-800 border-2 border-blue-500 rounded-lg p-3 shadow-2xl animate-slideUp" style={{ left: Math.max(10, Math.min((editingTextElement?.x || 0), activeCanvas.width - 220)), top: Math.max(10, Math.min((editingTextElement?.y || 0), activeCanvas.height - 120)), minWidth: '200px' }}>
                                            <textarea ref={textEditRef} defaultValue={editingTextElement?.text} autoFocus className="w-full p-2 bg-slate-700 border border-slate-600 rounded text-white resize-none focus:border-blue-500 transition-colors duration-200" style={{ minHeight: '60px' }} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); saveTextEdit(e.target.value); } else if (e.key === 'Escape') { setEditingTextElement(null); } }} />
                                            <div className="flex gap-2 mt-2 justify-end">
                                                <button onClick={() => { setEditingTextElement(null); }} className="px-3 py-1 text-sm bg-slate-700 hover:bg-slate-600 rounded transition-colors duration-200">Cancel</button>
                                                <button onClick={(e) => { const textarea = e.target.closest('div.absolute').querySelector('textarea'); saveTextEdit(textarea.value); }} className="px-3 py-1 text-sm bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded flex items-center gap-1 transition-all duration-200"><Save size={12} />Save</button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {activeCanvas && codePanelOpen && (
                    <div className="w-96 bg-slate-800 border-l border-slate-700 flex flex-col overflow-hidden transition-all duration-300">
                        <div className="p-3 border-b border-slate-700 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <h3 className="text-sm font-semibold text-gray-300 flex items-center gap-2"><Code size={16} />CODE OUTPUT</h3>
                                <div className="flex ml-4 bg-slate-700 rounded-md p-1">
                                    <button onClick={() => setCodeOutputType('html')} className={`px-2 py-1 text-xs rounded-md transition-all duration-200 ${codeOutputType === 'html' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}>HTML</button>
                                    <button onClick={() => setCodeOutputType('css')} className={`px-2 py-1 text-xs rounded-md transition-all duration-200 ${codeOutputType === 'css' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}>CSS</button>
                                    <button onClick={() => setCodeOutputType('js')} className={`px-2 py-1 text-xs rounded-md transition-all duration-200 ${codeOutputType === 'js' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}>JS</button>
                                </div>
                            </div>
                            <button onClick={() => setCodePanelOpen(false)} className="p-1 rounded hover:bg-slate-700 transition-colors"><X size={16} /></button>
                        </div>
                        <div className="flex-1 overflow-auto canvas-scroll">
                            <pre className="p-4 text-xs text-gray-300 whitespace-pre-wrap font-mono leading-relaxed">
                                {renderCode().split('\n').map((line, i) => (
                                    <div key={i} className="flex">
                                        <span className="text-slate-500 select-none w-8 text-right mr-3">{i + 1}</span>
                                        <span className="text-gray-300">{line}</span>
                                    </div>
                                ))}
                            </pre>
                        </div>
                        <div className="p-4 border-t border-slate-700 bg-slate-800/50 flex justify-between">
                           <button onClick={() => copyToClipboard(renderCode())} className="p-2 px-3 rounded-lg bg-slate-700 hover:bg-slate-600 flex items-center gap-2 text-xs transition-all duration-200">
                                <Copy size={12} />Copy {codeOutputType.toUpperCase()}
                            </button>
                            <div className="text-xs text-gray-400 space-x-4 flex"><div><span>Elements: </span><span className="text-blue-400">{state.elements.length}</span></div><div><span>Size: </span><span className="text-green-400">{activeCanvas.width}×{activeCanvas.height}</span></div></div>
                        </div>
                    </div>
                )}
                {!codePanelOpen && (<button onClick={() => setCodePanelOpen(true)} className="absolute right-0 top-1/2 z-10 mt-4 mr-2 p-2 bg-slate-800 rounded-l-lg border border-slate-700 border-r-0 shadow-md transition-all duration-200 hover:bg-slate-700"><Code size={16} /></button>)}
            </div>
            {showCanvasDropdown && (<div className="fixed inset-0 z-40" onClick={() => setShowCanvasDropdown(false)} />)}
        </div>
    );
}