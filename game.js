import * as THREE from './three.module.js';

        // --- 1. 常數與設定 ---
        const ROOM_SIZE = { width: 50, height: 20, depth: 40 };
        const CAMERA_HEIGHT = 4;
        const CAMERA_Z_OFFSET = 20;
        const HP_BAR_Y_OFFSET = 0.6;
        const HP_BAR_WIDTH_MULT = 2.2;
        const HP_BAR_MIN_WIDTH = 20;
        const TRACKING_VX_SMOOTH = 20;
        const TRACKING_TICK_INTERVAL = 50;
        const DAMAGE_FLASH_DURATION = 50;
        
        const SENS_CONVERSION_RATES = { val: 1.000, cs2: 3.182, apex: 3.182, ow: 10.606, r6: 12.216, pubg: 57.308 };

        const PROFILE_CONFIG = {
            custom: { name: '自訂 (Custom)', fovRange: [70, 130], sensId: null, sensRange: [0, 100] },
            val: { name: 'Valorant', fovFixed: 103, sensId: 'val', sensRange: [0.01, 10] },
            cs2: { name: 'CS2', fovFixed: { '16:9': 106, '4:3': 90 }, sensId: 'cs2', sensRange: [0.10, 8.00], useRatio: true }, 
            apex: { name: 'Apex Legends', fovRange: [70, 110], defaultFov: 90, sensId: 'apex', sensRange: [0.2, 20], useRatio: true },
            ow: { name: 'Overwatch', fovFixed: 103, sensId: 'ow', sensRange: [0, 100] },
            r6: { name: 'Rainbow Six Siege', fovRange: [60, 90], defaultFov: 90, sensId: 'r6', sensRange: [1, 100] },
            pubg: { name: 'PUBG', fovRange: [80, 103], defaultFov: 90, sensId: 'pubg', sensRange: [1, 100] }
        };

        const DEFAULT_CROSSHAIR_SETTINGS = {
            color: '#ffffff',
            opacity: '0.93',
            length: '4',
            thickness: '1.65',
            gap: '2',
            dotToggle: false,
            dotSize: '2',
            outlineToggle: true,
            outlineColor: '#000000',
            outlineThickness: '1'
        };
        
        const MODE_CONFIG = {
            mode1: { name: '一般訓練', duration: 60, targetCount: 3, targetRadius: 0.95, baseScore: 340, },
            mode2: { name: '精準訓練', duration: 60, targetCount: 5, targetRadius: 0.15, baseScore: 780, },
            mode_tracking: {
                name: '平移跟槍', duration: 60, targetCount: 1,
                radiusMin: 0.4, radiusMax: 1.5,
                health: 1500, 
                speedMin: 5, speedMax: 7,             // 移動速度區間
                burstMultMin: 1.3, burstMultMax: 1.5, // 折返加速度區間 (對應速度)
                burstDecay: 5,
                dirChangeMin: 500, dirChangeMax: 1600, // 統一轉向時間 (ms)
                scorePerHit: 240, scorePenalty: 40 // <--- 在這裡修改為 240 跟 40
            },
            mode_pos: {
                name: '折返甩槍', duration: 60, targetCount: 1,
                radiusMin: 0.4, radiusMax: 1.1, expireTime: 1200,
                spawnOffset: 5, spawnWidth: 30, spawnHeight: 14
            },
            mode_ft: {
                name: '微調訓練', duration: 60, targetCount: 1,
                radiusMin: 0.35, radiusMax: 0.6, expireTime: 1200,
                spawnOffset: 1.5, spawnWidth: 5.5, spawnHeight: 3.5
            }
        };

        // --- 2. DOM 元素快取 ---
        const $ = (selector) => document.querySelector(selector);
        const $$ = (selector) => document.querySelectorAll(selector);
        const DOMElements = {
            canvas: $('#game-canvas'),
            root: document.documentElement,
            screens: {
                start: $('#start-screen'),
                game: $('#hud'),
                pause: $('#pause-screen'),
                gameOver: $('#game-over-screen'),
                audioSettings: $('#audio-settings-modal'),
                versionModal: $('#version-modal'),
            },
            buttons: {
                start: $('#start-button'),
                playAgain: $('#play-again-button'),
                backToMenu: $('#back-to-menu-button'),
                resume: $('#resume-button'),
                menu: $('#menu-button'),
                restart: $('#restart-button'),
                clearScores: $$('.leaderboard-header .clear-scores-btn'),
                settings: $('#settings-btn'),
                backHome: $('#back-home-btn'),
                closeSettings: $('#close-settings-btn'),
                versionDisplay: $('#version-display'),
                closeVersion: $('#close-version-btn'),
                resetColors: $('#reset-colors-btn'),
                scopeCurrent: $('#scope-current'),
                scopeHistory: $('#scope-history'),
                panelFlipBtn: $('#panel-flip-btn'),
            },
            displays: {
                panelFlipText: $('#panel-flip-text'),
                fpsDisplay: $('#fps-display'),
                score: $('#score'),
                timer: $('#timer'),
                accuracy: $('#accuracy'),
                finalScore: $('#final-score'),
                finalAccuracy: $('#final-accuracy'),
                avgReactionTime: $('#avg-reaction-time'),
                avgScorePerHit: $('#avg-score-per-hit'),
                newRecordMsg: $('#new-record-msg'),
                fovValue: $('#fov-value'),
                tierTooltips: $$('.leaderboard-title-container .tier-tooltip'),
                hitVolumeVal: $('#hit-volume-val'),
                shootVolumeVal: $('#shoot-volume-val'),
                sensValue: $('#sens-value-display'),
                versionContent: $('#version-content'),
                previewCanvas: $('#preview-canvas'),
                trendChart: $('#trend-chart'),
                radarChart: $('#radar-chart'),
                radarChartAcc: $('#radar-chart-acc'),
                blindSpotText: $('#blind-spot-text'),
                blindSpotTextAcc: $('#blind-spot-text-acc'),
                statOvershoot: $('#stat-overshoot'),
                statUndershoot: $('#stat-undershoot'),
                chartTooltip: $('#chart-tooltip'),
                feedbackOverlay: $('#feedback-overlay'),
                hpBarContainer: $('#hp-bar-container'),
                hpBarFill: $('#hp-bar-fill'),
                damageOverlay: $('#damage-overlay'),
                leaderboardTitle: $('#leaderboard-title'),
                leaderboardTitleGameOver: $('#leaderboard-title-gameover'),
                analysisPanel: $('#analysis-panel'),
                crosshairPanel: $('#crosshair-customizer'),
                startWrapper: $('#start-screen .content-wrapper'),
                gameOverWrapper: $('#game-over-screen .content-wrapper'),
                rightColumn: $('#start-right-column'),
                scopeCurrentBtn: $('#scope-current'),
                scopeHistoryBtn: $('#scope-history'),
                trendChartTitle: $('#trend-chart-title'),
            },
            inputs: {
                fpsSelect: $('#fps-display-select'),
                debugSelect: $('#debug-mode-select'),
                sensitivitySlider: $('#sensitivity-slider'),
                sensitivityConversions: $('#sensitivity-conversions'),
                crosshairCustomizer: $('#crosshair-customizer'),
                gameModeSelect: $('#game-mode-select'),
                shortModeToggle: $('#short-mode-toggle'), 
                fovSlider: $('#fov-slider'),
                fovSliderContainer: $('#fov-slider-container'), 
                fovValue: $('#fov-value'),
                fovPreset: $('#fov-preset-select'), 
                hitVolume: $('#hit-volume-slider'),
                shootVolume: $('#shoot-volume-slider'),
                aspectRatioGroup: $('#aspect-ratio-group'), 
                aspectRatioSelect: $('#aspect-ratio-select'), 
                targetColorPicker: $('#target-color-picker'),
                sceneThemeSelect: $('#scene-theme-select'),
                historyScopeSelect: $('#history-scope-select'),
            },
            lists: {
                main: $('#highscore-list-main'),
                gameOver: $('#highscore-list-gameover'),
            },
            audio: {
                hit: $('#hit-sound'),
                shoot: $('#shoot-sound'),
            }
        };

        // --- 3. 遊戲狀態管理 ---
        const state = {
            showFps: true,
            debugMode: false,
            rightPanelTab: 'crosshair',
            score: 0, 
            accumulatedBaseScore: 0,
            timeLeft: 60, totalShots: 0, hits: 0, trackingTimeOnTarget: 0,
            gameActive: false, isPointerLocked: false,
            isWaitingToStart: false, countdownInterval: null,
            timerInterval: null,
            reactionTimes: [], lastHitTime: 0,
            pauseStartTime: 0, pauseStartPerfTime: 0,
            targets: [],
            sensitivity: 1.0,
            crosshair: {},
            gameMode: 'mode1',
            isShortMode: false, 
            hitVolume: 50, 
            shootVolume: 0, 
            targetHfov: 103,
            currentProfile: 'custom',
            aspectRatio: '16:9', 
            profileSensitivities: {},
            profileFovs: {},
            targetColor: '#ffffff',
            sceneTheme: 'dark',
            lastFrameTime: performance.now(),
            lastTrackingTick: 0,
            posNextCenter: true,
            posAnglesBag: [],
            trackingRadiusBag: [],
            elapsedMs: 0,
            historyScope: 10,
            hitColorHex: 0xff0000
        };

        function calcHitColor(hexString) {
            const c = new THREE.Color(hexString);
            // 如果自訂的球色非常接近紅色，則將擊中反饋色改為黃色
            return (c.r > 0.5 && c.g < 0.4 && c.b < 0.4) ? 0xffff00 : 0xff0000; 
        }

        // --- 短時模式輔助函式 ---
        function getActiveModeKey() {
            return state.isShortMode ? `${state.gameMode}_short` : state.gameMode;
        }

        // --- 4. Three.js 核心變數 ---
        let scene, camera, renderer, raycaster;
        let previewScene, previewCamera, previewRenderer, previewSphere;
        let ambientLight, hemiLight, dirLight;
        let previewAmbientLight, previewHemiLight, previewDirLight;
        const euler = new THREE.Euler(0, 0, 0, 'YXZ');
        let gridCanvas;
        let activeTextures = [];

        // --- 5. 本地儲存與輔助函式 ---
        const SCORE_VERSION = 2; 

        const storage = {
            get: (key, defaultValue) => {
                const value = localStorage.getItem(`aimweb_${key}`);
                try { 
                    return value ? JSON.parse(value) : JSON.parse(JSON.stringify(defaultValue)); 
                } catch (e) { 
                    return JSON.parse(JSON.stringify(defaultValue)); 
                }
            },
            set: (key, value) => {
                localStorage.setItem(`aimweb_${key}`, JSON.stringify(value));
            },
            checkScoreVersion: () => {
                const savedVersion = storage.get('scoreVersion', 1);
                
                if (savedVersion < SCORE_VERSION) {
                    for (const mode in MODE_CONFIG) {
                        storage.set(`highscores_${mode}`, []);
                        storage.set(`history_${mode}`, []);
                        // 順便清理舊版可能遺留的短時模式資料
                        storage.set(`highscores_${mode}_short`, []);
                        storage.set(`history_${mode}_short`, []);
                    }
                    storage.set('scoreVersion', SCORE_VERSION);
                    console.log("偵測到計分公式更新，已自動清除舊版不相容的分數紀錄。");
                }
            }
        };
        const toCamelCase = (str) => str.replace(/-(\w)/g, (_, letter) => letter.toUpperCase());
        const hexToRgba = (hex, alpha) => {
            const r = parseInt(hex.slice(1, 3), 16);
            const g = parseInt(hex.slice(3, 5), 16);
            const b = parseInt(hex.slice(5, 7), 16);
            return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        };

        function hfovToVfov(hfov, aspect) {
            const hfovRad = hfov * (Math.PI / 180);
            const vfovRad = 2 * Math.atan(Math.tan(hfovRad / 2) / aspect);
            return vfovRad * (180 / Math.PI);
        }

        function getTier(avgTime, modeKey = 'mode1') {
            if (modeKey.startsWith('mode2')) { 
                if (avgTime < 350) return { tier: 1, name: '神級 (Radiant)', color: '#ffffaa' };
                if (avgTime <= 500) return { tier: 2, name: '菁英 (Diamond)', color: '#b388eb' }; 
                if (avgTime <= 700) return { tier: 3, name: '熟練 (Gold)', color: '#ffd43b' }; 
                if (avgTime <= 900) return { tier: 4, name: '養成中 (Silver)', color: '#adb5bd' };
                return { tier: 5, name: '菜鳥 (Iron)', color: '#a1816f' };
            } else { 
                if (avgTime < 167) return { tier: 1, name: '宗師', color: '#e0aaff' };
                if (avgTime <= 212) return { tier: 2, name: '大師', color: '#74c0fc' };
                if (avgTime <= 264) return { tier: 3, name: '專家', color: '#63e6be' };
                if (avgTime <= 353) return { tier: 4, name: '熟練的', color: '#ffd43b' };
                if (avgTime <= 530) return { tier: 5, name: '有能力的', color: '#ff922b' };
                return { tier: 6, name: '新手', color: '#ced4da' };
            }
        }

        const AimTelemetryManager = {
            shots: [],
            pendingMisses: [], 
            trendHoverZones: [], 
            radarHoverZones: [], 
            radarAccHoverZones: [],
            lastHitYaw: 0,
            lastHitPitch: 0,
            currentScope: 'current',
            currentData: null,
            historyData: null,
            historyLength: 0,
            
            init() {
                this.shots = [];
                this.pendingMisses = [];
                this.currentScope = 'current';
                if (DOMElements.buttons.scopeCurrent) {
                    DOMElements.buttons.scopeCurrent.classList.add('active');
                    DOMElements.buttons.scopeHistory.classList.remove('active');
                }
                if (camera) {
                    const dir = new THREE.Vector3();
                    camera.getWorldDirection(dir);
                    const { yaw, pitch } = this.getYawPitch(dir);
                    this.lastHitYaw = yaw;
                    this.lastHitPitch = pitch;
                }
            },
            
            getYawPitch(vec3) {
                const yaw = Math.atan2(vec3.x, -vec3.z);
                const pitch = Math.asin(Math.max(-1, Math.min(1, vec3.y / vec3.length())));
                return { yaw, pitch };
            },
            
            getAngleDiff(a, b) {
                let diff = a - b;
                while (diff < -Math.PI) diff += 2 * Math.PI;
                while (diff > Math.PI) diff -= 2 * Math.PI;
                return diff;
            },
            
            getSector(dx, dy) {
                let angle = Math.atan2(dy, dx); 
                angle += Math.PI / 8; 
                if (angle < 0) angle += 2 * Math.PI;
                return Math.floor(angle / (Math.PI / 4)) % 8;
            },
            
            LogHit(targetPos, reactionTime) {
                if (state.gameMode === 'mode_tracking') return;
                const dir = targetPos.clone().sub(camera.position).normalize();
                const { yaw: tYaw, pitch: tPitch } = this.getYawPitch(dir);
                
                this.pendingMisses.forEach(m => {
                    const v_yaw = this.getAngleDiff(m.clickYaw, m.lastHitYaw);
                    const v_pitch = m.clickPitch - m.lastHitPitch;
                    const v_mag = Math.sqrt(v_yaw*v_yaw + v_pitch*v_pitch);
                    
                    const u_yaw = this.getAngleDiff(tYaw, m.lastHitYaw);
                    const u_pitch = tPitch - m.lastHitPitch;
                    const u_mag = Math.sqrt(u_yaw*u_yaw + u_pitch*u_pitch);
                    
                    let missType;
                    if (v_mag > u_mag) {
                        missType = 'overshoot'; 
                    } else {
                        missType = 'undershoot'; 
                    }
                    
                    this.shots.push({ type: missType, reactionTime: 0, angleId: m.angleId });
                });
                this.pendingMisses = []; 
                
                const dyaw = this.getAngleDiff(tYaw, this.lastHitYaw);
                const dpitch = tPitch - this.lastHitPitch;
                const angleId = this.getSector(dyaw, dpitch);
                
                this.shots.push({ type: 'hit', reactionTime, angleId });
                
                this.lastHitYaw = tYaw;
                this.lastHitPitch = tPitch;
            },
            
            LogMiss(clickDirVec, activeTargets) {
                if (state.gameMode === 'mode_tracking') return;
                const { yaw: clickYaw, pitch: clickPitch } = this.getYawPitch(clickDirVec);
                
                const v_yaw = this.getAngleDiff(clickYaw, this.lastHitYaw);
                const v_pitch = clickPitch - this.lastHitPitch;
                const angleId = this.getSector(v_yaw, v_pitch);
                
                this.pendingMisses.push({
                    clickYaw, clickPitch,
                    lastHitYaw: this.lastHitYaw,
                    lastHitPitch: this.lastHitPitch,
                    angleId
                });

                if (activeTargets && activeTargets.length > 0) {
                    let closestTarget = null;
                    let minDistance = Infinity;

                    activeTargets.forEach(t => {
                        const tDir = t.position.clone().sub(camera.position).normalize();
                        const { yaw: tYaw, pitch: tPitch } = this.getYawPitch(tDir);
                        const dyaw = this.getAngleDiff(clickYaw, tYaw);
                        const dpitch = clickPitch - tPitch;
                        const dist = Math.sqrt(dyaw*dyaw + dpitch*dpitch);
                        if (dist < minDistance) {
                            minDistance = dist;
                            closestTarget = t;
                        }
                    });

                    if (closestTarget) {
                        const tDir = closestTarget.position.clone().sub(camera.position).normalize();
                        const { yaw: tYaw, pitch: tPitch } = this.getYawPitch(tDir);

                        const v_mag = Math.sqrt(v_yaw*v_yaw + v_pitch*v_pitch);
                        const u_yaw = this.getAngleDiff(tYaw, this.lastHitYaw);
                        const u_pitch = tPitch - this.lastHitPitch;
                        const u_mag = Math.sqrt(u_yaw*u_yaw + u_pitch*u_pitch);

                        if (state.debugMode) {
                            if (v_mag > u_mag) {
                                UI.flashScreen('overshoot');
                            } else {
                                UI.flashScreen('undershoot');
                            }
                        }
                    }
                }
            },

            flushPendingMisses() {
                this.pendingMisses.forEach(m => {
                    this.shots.push({ type: 'undershoot', reactionTime: 0, angleId: m.angleId });
                });
                this.pendingMisses = [];
            },

            calculateStats(shots) {
                let overshoots = 0, undershoots = 0;
                let sectorStats = Array(8).fill(0).map(() => ({ hits: 0, misses: 0, ttk: 0 }));
                let globalTTKSum = 0, globalHitCount = 0;
                
                shots.forEach(s => {
                    if (s.type === 'hit') {
                        sectorStats[s.angleId].hits++;
                        sectorStats[s.angleId].ttk += s.reactionTime;
                        globalTTKSum += s.reactionTime;
                        globalHitCount++;
                    } else if (s.type === 'overshoot') {
                        sectorStats[s.angleId].misses++;
                        overshoots++;
                    } else if (s.type === 'undershoot') {
                        sectorStats[s.angleId].misses++;
                        undershoots++;
                    }
                });
                
                return { overshoots, undershoots, sectorStats, globalTTKSum, globalHitCount };
            },
            
            generateReport(historyData) {
                // 本次數據計算
                this.currentData = this.calculateStats(this.shots);
                
                // 近10場數據總計
                let allHistoryShots = [];
                historyData.forEach(h => {
                    if (h.shots && Array.isArray(h.shots)) {
                        allHistoryShots = allHistoryShots.concat(h.shots);
                    }
                });
                this.historyData = this.calculateStats(allHistoryShots);
                this.historyLength = historyData.length;
                
                this.drawTrend(historyData);
                this.renderTelemetry();
            },

            renderTelemetry() {
                const isHistory = this.currentScope === 'history';
                const isInsufficient = isHistory && this.historyLength < state.historyScope;
                const data = isHistory ? this.historyData : this.currentData;
                
                // 更新失誤百分比
                const totalMisses = data.overshoots + data.undershoots;
                const overPct = totalMisses > 0 ? Math.round((data.overshoots / totalMisses) * 100) : 0;
                const underPct = totalMisses > 0 ? Math.round((data.undershoots / totalMisses) * 100) : 0;
                
                const rowOver = document.getElementById('row-overshoot');
                const rowUnder = document.getElementById('row-undershoot');
                const lblOver = rowOver.querySelector('.stat-label');
                const valOver = document.getElementById('stat-overshoot');
                const lblUnder = rowUnder.querySelector('.stat-label');
                const valUnder = document.getElementById('stat-undershoot');
                
                valOver.textContent = `${overPct}% (${data.overshoots})`;
                valUnder.textContent = `${underPct}% (${data.undershoots})`;
                
                // 重置文字顏色
                lblOver.style.color = '#aaa';
                valOver.style.color = '#fff';
                lblUnder.style.color = '#aaa';
                valUnder.style.color = '#fff';

                // 失誤佔比高的顯示紅色 (連同標籤文字)
                if (totalMisses > 0) {
                    if (overPct > underPct) {
                        lblOver.style.color = '#ff6b6b';
                        valOver.style.color = '#ff6b6b';
                    } else if (underPct > overPct) {
                        lblUnder.style.color = '#ff6b6b';
                        valUnder.style.color = '#ff6b6b';
                    }
                }
                
                // 畫反應時間雷達圖
                const globalAvgTTK = data.globalHitCount > 0 ? data.globalTTKSum / data.globalHitCount : 0;
                this.drawRadar(data.sectorStats, globalAvgTTK, isInsufficient);

                // 畫命中率雷達圖
                const totalGlobalShots = data.globalHitCount + totalMisses;
                const globalAcc = totalGlobalShots > 0 ? data.globalHitCount / totalGlobalShots : 0;
                this.drawRadarAcc(data.sectorStats, globalAcc, isInsufficient);

                if (isInsufficient) {
                    DOMElements.displays.blindSpotText.textContent = '';
                    DOMElements.displays.blindSpotTextAcc.textContent = '';
                }
            },
            
            drawTrend(history) {
                const canvas = DOMElements.displays.trendChart;
                if (!canvas) return;
                const ctx = canvas.getContext('2d');
                const cw = canvas.width, ch = canvas.height;
                ctx.clearRect(0, 0, cw, ch);
                this.trendHoverZones = [];

                if(history.length < 2) {
                    ctx.fillStyle = '#888';
                    ctx.font = '12px Inter';
                    ctx.textAlign = 'center';
                    ctx.fillText('需完成至少2場產生趨勢圖', cw/2, ch/2);
                    return;
                }

                const padding = { top: 20, bottom: 20, left: 35, right: 35 };
                const w = cw - padding.left - padding.right;
                const h = ch - padding.bottom - padding.top;
                const scores = history.map(h => h.score);
                
                const maxScore = Math.max(...scores) > 0 ? Math.max(...scores) * 1.1 : 100;
                const minScore = Math.min(...scores) * 0.9;
                const accs = history.map(h => h.accuracyValue); 

                ctx.fillStyle = '#888';
                ctx.font = '10px Inter';
                ctx.textBaseline = 'middle';
                ctx.lineWidth = 1;

                const gridLines = 4;
                for (let i = 0; i <= gridLines; i++) {
                    const y = padding.top + h - (i / gridLines) * h;
                    
                    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
                    ctx.setLineDash([4, 4]);
                    ctx.beginPath();
                    ctx.moveTo(padding.left, y);
                    ctx.lineTo(padding.left + w, y);
                    ctx.stroke();
                    ctx.setLineDash([]);

                    const scoreLabel = Math.round(minScore + (maxScore - minScore) * (i / gridLines));
                    ctx.textAlign = 'right';
                    ctx.fillStyle = '#888';
                    ctx.fillText(scoreLabel, padding.left - 8, y);

                    const accLabel = Math.round((i / gridLines) * 100) + '%';
                    ctx.textAlign = 'left';
                    ctx.fillStyle = 'rgba(255, 215, 0, 0.6)';
                    ctx.fillText(accLabel, padding.left + w + 8, y);
                }

                const scorePoints = [];
                const accPoints = [];
                history.forEach((data, i) => {
                    const x = padding.left + (i / (history.length - 1)) * w;
                    const yScore = padding.top + h - ((data.score - minScore) / (maxScore - minScore || 1)) * h;
                    const yAcc = padding.top + h - (data.accuracyValue * h);
                    
                    scorePoints.push({ x, y: yScore, data });
                    accPoints.push({ x, y: yAcc });
                    
                    this.trendHoverZones.push({
                        x, y_score: yScore, y_acc: yAcc,
                        score: data.score, acc: data.accuracyValue, date: data.date
                    });
                });

                const drawSmoothLine = (points, color, isFill = false) => {
                    ctx.beginPath();
                    ctx.moveTo(points[0].x, points[0].y);
                    
                    for (let i = 0; i < points.length - 1; i++) {
                        const p0 = points[i];
                        const p1 = points[i + 1];
                        const cpX = (p0.x + p1.x) / 2; 
                        ctx.bezierCurveTo(cpX, p0.y, cpX, p1.y, p1.x, p1.y);
                    }

                    if (isFill) {
                        ctx.lineTo(points[points.length - 1].x, padding.top + h);
                        ctx.lineTo(points[0].x, padding.top + h);
                        ctx.closePath();
                        ctx.fillStyle = color;
                        ctx.fill();
                    } else {
                        ctx.strokeStyle = color;
                        ctx.stroke();
                    }
                };

                const gradient = ctx.createLinearGradient(0, padding.top, 0, padding.top + h);
                gradient.addColorStop(0, 'rgba(255, 255, 255, 0.15)');
                gradient.addColorStop(1, 'rgba(255, 255, 255, 0.0)');
                drawSmoothLine(scorePoints, gradient, true);

                ctx.shadowColor = 'rgba(255, 255, 255, 0.5)';
                ctx.shadowBlur = 8;
                ctx.lineWidth = 2.5;
                drawSmoothLine(scorePoints, '#ffffff'); 
                
                ctx.shadowColor = 'rgba(255, 215, 0, 0.5)';
                ctx.shadowBlur = 6;
                ctx.lineWidth = 2;
                drawSmoothLine(accPoints, 'rgba(255, 215, 0, 0.8)'); 

                ctx.shadowBlur = 0;

                const drawDots = (points, outerColor, innerColor) => {
                    points.forEach(p => {
                        ctx.beginPath();
                        ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
                        ctx.fillStyle = outerColor;
                        ctx.fill();
                        
                        ctx.beginPath();
                        ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
                        ctx.fillStyle = innerColor;
                        ctx.fill();
                    });
                };

                drawDots(scorePoints, '#ffffff', '#1a1a1a');
                drawDots(accPoints, 'rgba(255, 215, 0, 1)', '#1a1a1a');

                ctx.fillStyle = '#fff'; ctx.fillRect(padding.left, 8, 12, 3);
                ctx.fillStyle = '#aaa'; ctx.font = '10px Inter'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
                ctx.fillText('分數', padding.left + 18, 9);
                
                ctx.fillStyle = 'rgba(255, 215, 0, 0.8)'; ctx.fillRect(padding.left + 55, 8, 12, 3);
                ctx.fillStyle = '#aaa'; ctx.fillText('命中率', padding.left + 73, 9);
            },
            
            drawRadar(sectorData, globalTTK, isInsufficient = false) {
                const canvas = DOMElements.displays.radarChart;
                if (!canvas) return;
                const ctx = canvas.getContext('2d');
                const cw = canvas.width, ch = canvas.height;
                const cx = cw / 2, cy = ch / 2;
                const radius = Math.min(cx, cy) - 20; 
                ctx.clearRect(0, 0, cw, ch);
                this.radarHoverZones = [];

                ctx.strokeStyle = 'rgba(255,255,255,0.1)';
                ctx.lineWidth = 1;
                for(let i=1; i<=3; i++) {
                    ctx.beginPath();
                    ctx.arc(cx, cy, radius * (i/3), 0, Math.PI*2);
                    ctx.stroke();
                }

                const angles = [0, -Math.PI/4, -Math.PI/2, -Math.PI*0.75, Math.PI, Math.PI*0.75, Math.PI/2, Math.PI/4]; 
                const labels = ['右', '右上', '上', '左上', '左', '左下', '下', '右下'];

                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.font = '10px Inter';

                angles.forEach((ang, i) => {
                    ctx.beginPath();
                    ctx.moveTo(cx, cy);
                    ctx.lineTo(cx + Math.cos(ang) * radius, cy + Math.sin(ang) * radius);
                    ctx.stroke();

                    ctx.fillStyle = '#ccc';
                    ctx.fillText(labels[i], cx + Math.cos(ang) * (radius + 12), cy + Math.sin(ang) * (radius + 12));
                });

                if (isInsufficient) {
                    ctx.fillStyle = '#888';
                    ctx.font = '11px Inter';
                    const remaining = state.historyScope - this.historyLength;
                    ctx.fillText(`數據不足 (還差${remaining}場)`, cx, cy);
                    return;
                }

                if(globalTTK === 0) return; 
                const maxVal = globalTTK * 1.5; 
                
                ctx.beginPath();
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
                ctx.setLineDash([4, 4]);
                let baseR = (globalTTK / maxVal) * radius;
                baseR = Math.min(baseR, radius);
                ctx.arc(cx, cy, baseR, 0, Math.PI*2);
                ctx.stroke();
                ctx.setLineDash([]);
                
                ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
                ctx.font = '9px Inter';
                ctx.fillText(`全局平均: ${Math.round(globalTTK)}ms`, cx, cy - baseR - 6);

                ctx.beginPath();
                ctx.fillStyle = 'rgba(102, 126, 234, 0.4)';
                ctx.strokeStyle = '#667eea';
                ctx.lineWidth = 2;

                let worstSector = -1;
                let worstTTK = 0;
                
                const polygonPoints = [];

                angles.forEach((ang, i) => {
                    const stat = sectorData[i];
                    const ttk = stat.hits > 0 ? stat.ttk / stat.hits : globalTTK; 
                    if(ttk > worstTTK && stat.hits > 0) { worstTTK = ttk; worstSector = i; }

                    let r = (ttk / maxVal) * radius;
                    r = Math.min(r, radius); 
                    
                    const x = cx + Math.cos(ang) * r;
                    const y = cy + Math.sin(ang) * r;
                    polygonPoints.push({x, y, label: labels[i], ttk: Math.round(ttk), hits: stat.hits});
                    
                    if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
                });
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
                
                polygonPoints.forEach(p => {
                    ctx.fillStyle = '#667eea';
                    ctx.beginPath(); ctx.arc(p.x, p.y, 4, 0, Math.PI*2); ctx.fill();
                    this.radarHoverZones.push(p);
                });

                const textEl = DOMElements.displays.blindSpotText;
                if (worstSector !== -1 && worstTTK > globalTTK * 1.1) { 
                    textEl.textContent = `盲區警告：${labels[worstSector]}向 (平均 ${Math.round(worstTTK)}ms)`;
                    textEl.style.color = '#ff9999';
                } else {
                    textEl.textContent = `無明顯方位盲區`;
                    textEl.style.color = '#63e6be';
                }
            },

            drawRadarAcc(sectorData, globalAcc, isInsufficient = false) {
                const canvas = DOMElements.displays.radarChartAcc;
                if (!canvas) return;
                const ctx = canvas.getContext('2d');
                const cw = canvas.width, ch = canvas.height;
                const cx = cw / 2, cy = ch / 2;
                const radius = Math.min(cx, cy) - 20;
                ctx.clearRect(0, 0, cw, ch);
                this.radarAccHoverZones = [];

                ctx.strokeStyle = 'rgba(255,255,255,0.1)';
                ctx.lineWidth = 1;
                for(let i=1; i<=4; i++) {
                    ctx.beginPath();
                    ctx.arc(cx, cy, radius * (i/4), 0, Math.PI*2);
                    ctx.stroke();
                }

                const angles = [0, -Math.PI/4, -Math.PI/2, -Math.PI*0.75, Math.PI, Math.PI*0.75, Math.PI/2, Math.PI/4];
                const labels = ['右', '右上', '上', '左上', '左', '左下', '下', '右下'];

                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.font = '10px Inter';

                angles.forEach((ang, i) => {
                    ctx.beginPath();
                    ctx.moveTo(cx, cy);
                    ctx.lineTo(cx + Math.cos(ang) * radius, cy + Math.sin(ang) * radius);
                    ctx.stroke();

                    ctx.fillStyle = '#ccc';
                    ctx.fillText(labels[i], cx + Math.cos(ang) * (radius + 12), cy + Math.sin(ang) * (radius + 12));
                });

                if (isInsufficient) {
                    ctx.fillStyle = '#888';
                    ctx.font = '11px Inter';
                    const remaining = state.historyScope - this.historyLength;
                    ctx.fillText(`數據不足 (還差${remaining}場)`, cx, cy);
                    return;
                }

                if (isNaN(globalAcc) || (globalAcc === 0 && sectorData.every(s => s.hits + s.misses === 0))) return; 

                ctx.beginPath();
                ctx.fillStyle = 'rgba(255, 215, 0, 0.25)';
                ctx.strokeStyle = '#ffd700';
                ctx.lineWidth = 2;

                let worstSector = -1;
                let worstAcc = 1.0;

                const polygonPoints = [];

                angles.forEach((ang, i) => {
                    const stat = sectorData[i];
                    const total = stat.hits + stat.misses;
                    const acc = total > 0 ? stat.hits / total : globalAcc; 

                    if (total > 0 && acc < worstAcc) {
                        worstAcc = acc;
                        worstSector = i;
                    }

                    const r = acc * radius;
                    const x = cx + Math.cos(ang) * r;
                    const y = cy + Math.sin(ang) * r;

                    polygonPoints.push({ x, y, label: labels[i], acc: Math.round(acc * 100), total });

                    if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
                });
                ctx.closePath();
                ctx.fill();
                ctx.stroke();

                polygonPoints.forEach(p => {
                    ctx.fillStyle = '#ffd700';
                    ctx.beginPath(); ctx.arc(p.x, p.y, 4, 0, Math.PI*2); ctx.fill();
                    this.radarAccHoverZones.push(p);
                });

                ctx.beginPath();
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
                ctx.setLineDash([4, 4]);
                let baseR = globalAcc * radius;
                ctx.arc(cx, cy, baseR, 0, Math.PI*2);
                ctx.stroke();
                ctx.setLineDash([]);

                ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
                ctx.font = '9px Inter';
                ctx.fillText(`全局平均: ${Math.round(globalAcc * 100)}%`, cx, cy - baseR - 6);

                const textEl = DOMElements.displays.blindSpotTextAcc;
                if (worstSector !== -1 && worstAcc < globalAcc * 0.9 && worstAcc < 0.95) { 
                    textEl.textContent = `盲區警告：${labels[worstSector]}向 (命中率 ${Math.round(worstAcc * 100)}%)`;
                    textEl.style.color = '#ff9999';
                } else {
                    textEl.textContent = `無明顯命中率盲區`;
                    textEl.style.color = '#63e6be';
                }
            }
        };

        // --- 6. UI 更新函式 ---
        const UI = {
            flashScreen(type) {
                const overlay = DOMElements.displays.feedbackOverlay;
                if (!overlay) return;

                overlay.style.transition = 'none';
                overlay.style.opacity = '1';

                if (type === 'overshoot') {
                    overlay.style.backgroundColor = 'rgba(255, 0, 0, 0.25)'; 
                } else {
                    overlay.style.backgroundColor = 'rgba(0, 255, 0, 0.15)'; 
                }

                void overlay.offsetWidth;

                overlay.style.transition = 'opacity 0.4s ease-out';
                overlay.style.opacity = '0';
            },

            showScreen(screenName) {
                if (screenName === 'audioSettings' || screenName === 'versionModal') {
                    DOMElements.screens[screenName].classList.remove('hidden');
                    if (screenName === 'audioSettings') {
                        setTimeout(resizePreviewCanvas, 50); 
                    }
                    return;
                }

                Object.values(DOMElements.screens).forEach(s => s.classList.add('hidden'));
                if (DOMElements.screens[screenName]) {
                    DOMElements.screens[screenName].classList.remove('hidden');
                }
                DOMElements.canvas.style.cursor = (screenName === 'game') ? 'none' : 'default';

                const isOverlayVisible = (screenName !== 'game');
                DOMElements.buttons.settings.style.display = isOverlayVisible ? 'block' : 'none';
                if (DOMElements.buttons.backHome) DOMElements.buttons.backHome.style.display = (screenName === 'start') ? 'block' : 'none';
            },
            hideScreen(screenName) {
                if (DOMElements.screens[screenName]) {
                    DOMElements.screens[screenName].classList.add('hidden');
                }
            },
            updateScore() { 
                DOMElements.displays.score.textContent = `分數: ${Math.floor(state.score)}`; 
                
                let acc = 0;
                if (state.gameMode === 'mode_tracking') {
                    if (state.elapsedMs > 0) {
                        acc = state.trackingTimeOnTarget / state.elapsedMs;
                    }
                } else {
                    if (state.totalShots > 0) {
                        acc = state.hits / state.totalShots;
                    }
                }
                
                acc = Math.max(0, Math.min(1, acc)); // 限制在 0 ~ 1 之間
                if (DOMElements.displays.accuracy) {
                    DOMElements.displays.accuracy.textContent = `命中率: ${Math.round(acc * 100)}%`;
                }
            },
            updateTimer() { DOMElements.displays.timer.textContent = `時間: ${state.timeLeft}`; },
            updateHighscores(modeKey, newestScore = null) {
                const key = `highscores_${modeKey}`;
                const scores = storage.get(key, []);

                const lists = [DOMElements.lists.main, DOMElements.lists.gameOver];
                lists.forEach(list => {
                    if (!list) return;
                    list.innerHTML = '';
                    if (scores.length === 0) {
                        list.innerHTML = '<li>尚無紀錄</li>';
                    } else {
                        scores.forEach(s => {
                            const li = document.createElement('li');
                            if (newestScore && s.date === newestScore.date && s.score === newestScore.score) {
                                li.classList.add('new-highscore');
                            }
                            
                            const scoreLabelText = modeKey.startsWith('mode_tracking') ? '每秒平均得分' : '平均得分';
                            const avgScoreText = s.avgScorePerHit !== undefined ? `<span>${scoreLabelText}: ${s.avgScorePerHit}</span>` : '';

                            li.innerHTML = `
                                <span class="score">${s.score} 分</span>
                                <div class="details">
                                    <span class="date">${s.date}</span>
                                    <div class="stats">
                                        ${avgScoreText}
                                        <span>準確率: ${s.accuracy || 'N/A'}</span>
                                        <span>平均時間: ${s.avgReactionTime || 'N/A'} ms</span>
                                    </div>
                                </div>`;
                            list.appendChild(li);
                        });
                    }
                });

                if (scores.length > 0) {
                    if (modeKey.startsWith('mode_tracking')) {
                        DOMElements.displays.tierTooltips.forEach(tooltip => {
                            tooltip.textContent = `平移跟槍模式 (以得分為準)`;
                            tooltip.style.color = '#63e6be';
                        });
                    } else {
                        const totalAvgTime = scores.reduce((acc, s) => acc + (s.avgReactionTime || 0), 0);
                        const leaderboardAvgTime = totalAvgTime / scores.length;
                        const tier = getTier(leaderboardAvgTime, modeKey);
                        DOMElements.displays.tierTooltips.forEach(tooltip => {
                            tooltip.textContent = `Tier ${tier.tier} ${tier.name} (${Math.round(leaderboardAvgTime)}毫秒)`;
                            tooltip.style.color = tier.color;
                        });
                    }
                } else {
                     DOMElements.displays.tierTooltips.forEach(tooltip => {
                        tooltip.textContent = '尚無排行資料';
                        tooltip.style.color = '#ced4da';
                    });
                }
            },
            populateModeSelector() {
                const select = DOMElements.inputs.gameModeSelect;
                select.innerHTML = '';
                for (const modeKey in MODE_CONFIG) {
                    const option = document.createElement('option');
                    option.value = modeKey;
                    option.textContent = state.isShortMode ? `${MODE_CONFIG[modeKey].name} - 短時` : MODE_CONFIG[modeKey].name;
                    select.appendChild(option);
                }
            },
            updateRightPanelTab(tabName) {
                state.rightPanelTab = tabName;
                storage.set('rightPanelTab', tabName);
                
                const btnFlip = DOMElements.buttons.panelFlipBtn;
                const txtFlip = DOMElements.displays.panelFlipText;
                const pnlCrosshair = DOMElements.displays.crosshairPanel;
                const pnlAnalysis = DOMElements.displays.analysisPanel;
                const rightCol = DOMElements.displays.rightColumn;

                if (!btnFlip) return;

                if (tabName === 'crosshair') {
                    if (txtFlip) txtFlip.textContent = '數據分析';
                    pnlCrosshair.style.display = 'block';
                    if (pnlAnalysis.parentNode === rightCol) {
                        pnlAnalysis.style.display = 'none';
                    }
                } else {
                    if (txtFlip) txtFlip.textContent = '準心設定';
                    pnlCrosshair.style.display = 'none';
                    
                    if (pnlAnalysis.parentNode !== rightCol) {
                        rightCol.appendChild(pnlAnalysis);
                    }
                    pnlAnalysis.style.display = 'flex';
                    
                    if (DOMElements.displays.scopeCurrentBtn) {
                        DOMElements.displays.scopeCurrentBtn.style.display = 'none';
                        DOMElements.displays.scopeCurrentBtn.classList.remove('active');
                    }
                    if (DOMElements.displays.scopeHistoryBtn) {
                        DOMElements.displays.scopeHistoryBtn.classList.add('active');
                    }
                    AimTelemetryManager.currentScope = 'history';
                    
                    const historyData = storage.get(`history_${getActiveModeKey()}`, []);
                    const slicedData = historyData.slice(-state.historyScope);
                    AimTelemetryManager.shots = [];
                    AimTelemetryManager.generateReport(slicedData);
                }
            }
        };

        // --- 7. 設定管理 (靈敏度 & 準心 & 音效) ---
        const Settings = {
            applySensitivity(baseSens) {
                const config = PROFILE_CONFIG[state.currentProfile];
                let min = 0, max = 100;
                if (config && config.sensRange) {
                    min = config.sensRange[0];
                    max = config.sensRange[1];
                }
                
                const rate = (config && config.sensId) ? SENS_CONVERSION_RATES[config.sensId] : 1.0;
                let gameSens = baseSens * rate;
                
                if (gameSens < min) gameSens = min;
                if (gameSens > max) gameSens = max;
                
                baseSens = gameSens / rate;

                state.sensitivity = baseSens;
                state.profileSensitivities[state.currentProfile] = baseSens;
                storage.set('profileSensitivities', state.profileSensitivities);

                for (const game in SENS_CONVERSION_RATES) {
                    const span = $(`#${game}-sens`);
                    if (span) span.textContent = (baseSens * SENS_CONVERSION_RATES[game]).toFixed(3);
                }
                
                if (config && config.sensId) {
                    DOMElements.displays.sensValue.textContent = gameSens.toFixed(3);
                }

                DOMElements.inputs.sensitivitySlider.value = gameSens.toFixed(3);
                storage.set('sensitivity', baseSens);
            },
            applyFov(displayFov, isFixed = false) {
                const config = PROFILE_CONFIG[state.currentProfile];
                
                let min = 70, max = 130;
                if (!isFixed && config && config.fovRange) {
                    min = config.fovRange[0];
                    max = config.fovRange[1];
                }

                const clampedDisplayFov = isFixed ? displayFov : Math.max(min, Math.min(max, displayFov));
                
                if (!isFixed) {
                    state.profileFovs[state.currentProfile] = clampedDisplayFov;
                    storage.set('profileFovs', state.profileFovs);
                    DOMElements.inputs.fovSlider.min = min;
                    DOMElements.inputs.fovSlider.max = max;
                }
                
                DOMElements.displays.fovValue.textContent = clampedDisplayFov;
                DOMElements.inputs.fovSlider.value = clampedDisplayFov;

                let targetHfov = clampedDisplayFov;

                if (!isFixed) {
                    if (state.currentProfile === 'apex') {
                        if (state.aspectRatio === '16:9') {
                            targetHfov = (180/Math.PI) * 2 * Math.atan(Math.tan((clampedDisplayFov * Math.PI/180)/2) * (4/3));
                        } else {
                            targetHfov = clampedDisplayFov;
                        }
                    } else if (state.currentProfile === 'r6') {
                        targetHfov = (180/Math.PI) * 2 * Math.atan(Math.tan((clampedDisplayFov * Math.PI/180)/2) * (16/9));
                    }
                }

                state.targetHfov = targetHfov;
                onWindowResize();
                storage.set('targetHfov', targetHfov);
            },
            applyProfile(profileKey) {
                state.currentProfile = profileKey;
                storage.set('fovProfile', profileKey);
                
                const config = PROFILE_CONFIG[profileKey];
                if (!config) return;

                const isCustom = profileKey === 'custom';
                const conversionsContainer = DOMElements.inputs.sensitivityConversions;

                if (isCustom) {
                    DOMElements.inputs.aspectRatioGroup.style.display = 'none';
                } else {
                    DOMElements.inputs.aspectRatioGroup.style.display = 'flex';
                    if (config.useRatio) {
                        DOMElements.inputs.aspectRatioSelect.disabled = false;
                        DOMElements.inputs.aspectRatioGroup.style.opacity = '1';
                        DOMElements.inputs.aspectRatioGroup.style.pointerEvents = 'auto';
                        DOMElements.inputs.aspectRatioSelect.value = state.aspectRatio; // 恢復成玩家自己設定的比例
                    } else {
                        DOMElements.inputs.aspectRatioSelect.disabled = true;
                        DOMElements.inputs.aspectRatioGroup.style.opacity = '0.4';
                        DOMElements.inputs.aspectRatioGroup.style.pointerEvents = 'none';
                        DOMElements.inputs.aspectRatioSelect.value = '16:9'; // 強制鎖定視覺顯示為 16:9
                    }
                }

                if (config.fovFixed) {
                    let fixedFov = config.fovFixed;
                    if (typeof fixedFov === 'object') {
                        fixedFov = fixedFov[state.aspectRatio] || 106;
                    }
                    DOMElements.inputs.fovSlider.disabled = true;
                    DOMElements.inputs.fovSliderContainer.classList.add('disabled');
                    DOMElements.inputs.fovValue.contentEditable = false;
                    DOMElements.inputs.fovValue.style.cursor = 'default';
                    Settings.applyFov(fixedFov, true); 
                } else {
                    DOMElements.inputs.fovSlider.disabled = false;
                    DOMElements.inputs.fovSliderContainer.classList.remove('disabled');
                    DOMElements.inputs.fovValue.contentEditable = true;
                    DOMElements.inputs.fovValue.style.cursor = 'text';
                    
                    let savedFov = state.profileFovs[profileKey];
                    if (savedFov === undefined) savedFov = config.defaultFov || 103;
                    Settings.applyFov(savedFov, false);
                }

                const slider = DOMElements.inputs.sensitivitySlider;
                if (config.sensRange) {
                    slider.min = config.sensRange[0].toString();
                    slider.max = config.sensRange[1].toString();
                } else {
                    slider.min = "0";
                    slider.max = "100";
                }
                slider.step = "any";

                if (isCustom) {
                    conversionsContainer.style.display = 'grid'; 
                    DOMElements.displays.sensValue.style.display = 'none';
                } else {
                    conversionsContainer.style.display = 'none'; 
                    DOMElements.displays.sensValue.style.display = 'inline-block';
                }

                let savedProfileSens = state.profileSensitivities[profileKey];
                if (savedProfileSens === undefined) {
                    savedProfileSens = state.profileSensitivities['custom'] || 1.0;
                    state.profileSensitivities[profileKey] = savedProfileSens;
                }
                Settings.applySensitivity(savedProfileSens);
            },
            applyCrosshairStyle() {
                const controls = DOMElements.inputs.crosshairCustomizer.querySelectorAll('[id^="crosshair-"]');
                controls.forEach(control => {
                    const key = toCamelCase(control.id.replace('crosshair-', ''));
                    state.crosshair[key] = control.type === 'checkbox' ? control.checked : control.value;
                    const valueLabel = $(`#${control.id.replace('crosshair-', '')}-value`);
                    if (valueLabel) {
                        let displayValue = control.value;
                        if (control.step && parseFloat(control.step) < 1) {
                            displayValue = parseFloat(control.value).toFixed(2);
                        }
                        valueLabel.textContent = displayValue;
                    }
                });
                
                const { color, opacity, length, thickness, gap, dotToggle, dotSize, outlineToggle, outlineColor, outlineThickness } = state.crosshair;
                const rootStyle = DOMElements.root.style;
                
                const mainRgbaColor = hexToRgba(color, opacity);
                rootStyle.setProperty('--crosshair-color', mainRgbaColor);
                rootStyle.setProperty('--crosshair-length', `${length}px`);
                rootStyle.setProperty('--crosshair-thickness', `${thickness}px`);
                rootStyle.setProperty('--crosshair-gap', `${gap}px`);
                rootStyle.setProperty('--crosshair-dot-display', dotToggle ? 'block' : 'none');
                rootStyle.setProperty('--crosshair-dot-size', `${dotSize}px`);

                const outlineRgbaColor = hexToRgba(outlineColor, opacity);
                const outlineStyle = outlineToggle ? `0px 0px 0px ${outlineThickness}px ${outlineRgbaColor}` : 'none';
                rootStyle.setProperty('--crosshair-outline-style', outlineStyle);

                storage.set('crosshair', state.crosshair);
            },
            setHitVolume(vol) {
                state.hitVolume = vol;
                DOMElements.displays.hitVolumeVal.textContent = `${vol}%`;
                storage.set('hitVolume', vol);
            },
            setShootVolume(vol) {
                state.shootVolume = vol;
                DOMElements.displays.shootVolumeVal.textContent = `${vol}%`;
                storage.set('shootVolume', vol);
            },
            load() {
                // 讀取模式 (防呆檢查：避免舊的 mode3 造成崩潰)
                let savedMode = storage.get('gameMode', 'mode1');
                if (!MODE_CONFIG[savedMode]) {
                    savedMode = 'mode1'; 
                }
                DOMElements.inputs.gameModeSelect.value = savedMode;
                state.gameMode = savedMode;
                
                // 讀取短時模式設定
                state.isShortMode = storage.get('isShortMode', false);
                DOMElements.inputs.shortModeToggle.checked = state.isShortMode;
                
                UI.populateModeSelector();
                DOMElements.inputs.gameModeSelect.value = state.gameMode;

                const defaultProfileSens = { custom: 1.0 };
                Object.keys(PROFILE_CONFIG).forEach(k => defaultProfileSens[k] = 1.0);
                
                state.profileSensitivities = storage.get('profileSensitivities', defaultProfileSens);
                if (!state.profileSensitivities['custom']) state.profileSensitivities['custom'] = 1.0;

                state.profileFovs = storage.get('profileFovs', { custom: 103, apex: 90, r6: 90, pubg: 90 });

                const savedProfile = storage.get('fovProfile', 'custom');
                DOMElements.inputs.fovPreset.value = savedProfile;
                
                state.aspectRatio = storage.get('aspectRatio', '16:9');
                DOMElements.inputs.aspectRatioSelect.value = state.aspectRatio;

                Settings.applyProfile(savedProfile);
                
                state.crosshair = storage.get('crosshair', DEFAULT_CROSSHAIR_SETTINGS);
                const controls = DOMElements.inputs.crosshairCustomizer.querySelectorAll('[id^="crosshair-"]');
                controls.forEach(control => {
                    const key = toCamelCase(control.id.replace('crosshair-', ''));
                    if (state.crosshair.hasOwnProperty(key)) {
                        control[control.type === 'checkbox' ? 'checked' : 'value'] = state.crosshair[key];
                    }
                });
                Settings.applyCrosshairStyle();

                const savedHitVol = storage.get('hitVolume', 50);
                DOMElements.inputs.hitVolume.value = savedHitVol;
                Settings.setHitVolume(savedHitVol);

                const savedShootVol = storage.get('shootVolume', 0);
                DOMElements.inputs.shootVolume.value = savedShootVol;
                Settings.setShootVolume(savedShootVol);

                state.showFps = storage.get('showFps', true);
                DOMElements.inputs.fpsSelect.value = state.showFps ? 'on' : 'off';
                DOMElements.displays.fpsDisplay.style.display = state.showFps ? 'block' : 'none';

                state.debugMode = storage.get('debugMode', false);
                if (DOMElements.inputs.debugSelect) DOMElements.inputs.debugSelect.value = state.debugMode ? 'on' : 'off';

                state.rightPanelTab = storage.get('rightPanelTab', 'crosshair');
                UI.updateRightPanelTab(state.rightPanelTab);

                state.sceneTheme = storage.get('sceneTheme', 'dark');
                if (DOMElements.inputs.sceneThemeSelect) DOMElements.inputs.sceneThemeSelect.value = state.sceneTheme;
                buildEnvironment();
                buildPreviewEnvironment();

                state.historyScope = parseInt(storage.get('historyScope', 10));
                if (DOMElements.inputs.historyScopeSelect) {
                    DOMElements.inputs.historyScopeSelect.value = state.historyScope;
                }
                Game.updateAnalysisScopeUI();

                state.targetColor = storage.get('targetColor', '#ffffff');
                state.hitColorHex = calcHitColor(state.targetColor);
                DOMElements.inputs.targetColorPicker.value = state.targetColor;
                if (previewSphere) {
                    const color = new THREE.Color(state.targetColor);
                    previewSphere.material.color.set(color);
                    previewSphere.material.emissive.set(color.clone().multiplyScalar(0.33));
                    state.targets.forEach(t => {
                        t.material.color.set(color);
                        t.material.emissive.set(color.clone().multiplyScalar(0.33));
                    });
                }
            }
        };
        
        // --- 8. 遊戲核心邏輯 ---
        const Game = {
            updateAnalysisScopeUI() {
                if (DOMElements.displays.trendChartTitle) {
                    DOMElements.displays.trendChartTitle.textContent = `近${state.historyScope}場趨勢 (分數/命中率)`;
                }
                if (DOMElements.displays.scopeHistoryBtn) {
                    DOMElements.displays.scopeHistoryBtn.textContent = `近${state.historyScope}場`;
                }
                if (state.rightPanelTab === 'analysis' && DOMElements.displays.analysisPanel.parentNode === DOMElements.displays.rightColumn) {
                    const historyData = storage.get(`history_${getActiveModeKey()}`, []);
                    const slicedData = historyData.slice(-state.historyScope);
                    AimTelemetryManager.shots = [];
                    AimTelemetryManager.generateReport(slicedData);
                }
            },
            destroyTarget(t) {
                scene.remove(t);
                if (t.geometry) t.geometry.dispose();
                if (t.material) t.material.dispose();
            },
            initSequence() {
                const startOption = document.getElementById('start-option-select').value;
                const overlay = document.getElementById('game-start-overlay');
                const textEl = document.getElementById('game-start-text');
                
                camera.position.set(0, CAMERA_HEIGHT, ROOM_SIZE.depth / 2 - CAMERA_Z_OFFSET);
                euler.set(0, 0, 0);
                camera.quaternion.setFromEuler(euler);
                state.targets.forEach(t => Game.destroyTarget(t));
                state.targets.length = 0;
                
                UI.showScreen('game');
                DOMElements.displays.hpBarContainer.classList.add('hidden');
                DOMElements.displays.hpBarFill.style.width = '100%';
                
                DOMElements.displays.score.textContent = "分數: 0";
                if (DOMElements.displays.accuracy) {
                    DOMElements.displays.accuracy.textContent = "命中率: 0%";
                }
                
                const config = MODE_CONFIG[state.gameMode];
                const gameDuration = state.isShortMode ? Math.max(1, Math.floor(config.duration / 4)) : config.duration;
                DOMElements.displays.timer.textContent = `時間: ${gameDuration}`;

                if (startOption === 'countdown') {
                    let seconds = parseInt(document.getElementById('countdown-seconds').value) || 0;
                    if (seconds > 0) {
                        overlay.classList.remove('hidden');
                        textEl.style.fontSize = "6rem";
                        textEl.textContent = seconds;
                        state.countdownInterval = setInterval(() => {
                            seconds--;
                            if (seconds > 0) {
                                textEl.textContent = seconds;
                                textEl.style.animation = 'none';
                                textEl.offsetHeight; /* trigger reflow */
                                textEl.style.animation = null; 
                            } else {
                                clearInterval(state.countdownInterval);
                                state.countdownInterval = null;
                                overlay.classList.add('hidden');
                                Game.start(gameDuration);
                            }
                        }, 1000);
                    } else {
                        overlay.classList.remove('hidden');
                        textEl.textContent = "點擊螢幕開始";
                        textEl.style.fontSize = "4rem"; 
                        state.isWaitingToStart = true;
                    }
                } else {
                    Game.start(gameDuration);
                }
            },
            cancelSequence() {
                state.isWaitingToStart = false;
                const overlay = document.getElementById('game-start-overlay');
                if (overlay) overlay.classList.add('hidden');
                UI.showScreen('start');
                if (document.pointerLockElement) document.exitPointerLock();
            },
            start(precalculatedDuration) {
                AimTelemetryManager.init();

                const config = MODE_CONFIG[state.gameMode];
                const gameDuration = precalculatedDuration || (state.isShortMode ? Math.max(1, Math.floor(config.duration / 4)) : config.duration);

                Object.assign(state, {
                    score: 0, 
                    accumulatedBaseScore: 0,
                    timeLeft: gameDuration,
                    totalShots: 0, 
                    hits: 0, trackingTimeOnTarget: 0,
                    reactionTimes: [], 
                    lastHitTime: Date.now(),
                    pauseStartTime: 0, pauseStartPerfTime: 0,
                    gameActive: true,
                    posNextCenter: true,
                    posAnglesBag: [],
                    lastTrackingTick: performance.now(),
                    lastFrameTime: performance.now(),
                    elapsedMs: 0
                });

                if (DOMElements.displays.accuracy) {
                    DOMElements.displays.accuracy.textContent = `命中率: 0%`;
                }

                for (let i = 0; i < config.targetCount; i++) {
                    Game.createTarget();
                }

                state.timerInterval = setInterval(() => {
                    state.timeLeft--;
                    UI.updateTimer();
                    if (state.timeLeft <= 0) Game.end();
                }, 1000);
            },
            end() {
                if (!state.gameActive) return;
                state.gameActive = false;
                clearInterval(state.timerInterval);
                if (document.pointerLockElement) document.exitPointerLock();

                // 清算剩餘未處理失誤，確保進入 telemetry 的數值正確
                AimTelemetryManager.flushPendingMisses();

                DOMElements.buttons.playAgain.disabled = true;
                DOMElements.buttons.backToMenu.disabled = true;

                let accuracyValue = 0;
                let accuracyString = '0.00%';
                let finalScore = 0;
                
                if (state.gameMode === 'mode_tracking') {
                    const gameDurationMs = (state.isShortMode ? Math.max(1, Math.floor(MODE_CONFIG[state.gameMode].duration / 4)) : MODE_CONFIG[state.gameMode].duration) * 1000;
                    accuracyValue = state.trackingTimeOnTarget / gameDurationMs;
                    accuracyString = (accuracyValue * 100).toFixed(2) + '%';
                    finalScore = Math.floor(state.score);
                } else {
                    accuracyValue = state.totalShots > 0 ? (state.hits / state.totalShots) : 0;
                    accuracyString = (accuracyValue * 100).toFixed(2) + '%';
                    if (state.totalShots > 0) {
                        finalScore = Math.round(state.accumulatedBaseScore * Math.sqrt(accuracyValue));
                    }
                }
                state.score = finalScore;

                const totalReactionTime = state.reactionTimes.reduce((a, b) => a + b, 0);
                const avgReactionTime = state.reactionTimes.length > 0 ? Math.round(totalReactionTime / state.reactionTimes.length) : 0;
                
                let avgScorePerHit = 0;
                const avgScoreLabel = document.getElementById('avg-score-label');
                if (state.gameMode === 'mode_tracking') {
                    const durationSec = state.elapsedMs > 0 ? state.elapsedMs / 1000 : 1;
                    avgScorePerHit = Math.round(state.score / durationSec);
                    if (avgScoreLabel) avgScoreLabel.textContent = '每秒平均得分';
                } else {
                    avgScorePerHit = state.hits > 0 ? Math.round(state.score / state.hits) : 0;
                    if (avgScoreLabel) avgScoreLabel.textContent = '平均得分';
                }

                DOMElements.displays.finalScore.textContent = `${state.score}`;
                DOMElements.displays.avgScorePerHit.textContent = avgScorePerHit;
                DOMElements.displays.finalAccuracy.textContent = accuracyString;
                DOMElements.displays.avgReactionTime.textContent = `${avgReactionTime} ms`;
                
                // 遊戲結束產生報表前，確保 UI 狀態重置並回到 '本次' (current)
                if (DOMElements.displays.analysisPanel.parentNode !== DOMElements.displays.gameOverWrapper) {
                    DOMElements.displays.gameOverWrapper.appendChild(DOMElements.displays.analysisPanel);
                }
                DOMElements.displays.analysisPanel.style.display = 'flex';
                if (DOMElements.displays.scopeCurrentBtn) {
                    DOMElements.displays.scopeCurrentBtn.style.display = '';
                    DOMElements.displays.scopeCurrentBtn.classList.add('active');
                }
                if (DOMElements.displays.scopeHistoryBtn) DOMElements.displays.scopeHistoryBtn.classList.remove('active');
                AimTelemetryManager.currentScope = 'current';

                const isNewRecord = Game.saveScore(state.score, accuracyString, avgReactionTime, avgScorePerHit); 
                
                if (isNewRecord) {
                    DOMElements.displays.newRecordMsg.classList.remove('hidden');
                } else {
                    DOMElements.displays.newRecordMsg.classList.add('hidden');
                }

                UI.showScreen('gameOver');
                
                setTimeout(() => { 
                    DOMElements.buttons.playAgain.disabled = false;
                    DOMElements.buttons.backToMenu.disabled = false;
                }, 744); 
            },
            pause() {
                if (!state.gameActive) return;
                state.pauseStartTime = Date.now(); 
                state.pauseStartPerfTime = performance.now();
                clearInterval(state.timerInterval);
                UI.showScreen('pause');
            },
            resume() {
                DOMElements.canvas.requestPointerLock().catch(err => {
                    console.warn("Pointer lock request failed:", err.name);
                });
            },
            restart() {
                state.gameActive = false; 
                clearInterval(state.timerInterval);
                DOMElements.canvas.requestPointerLock().catch(err => {
                    console.warn("Pointer lock request failed:", err.name);
                });
            },
            returnToMenu() {
                state.gameActive = false;
                state.isPointerLocked = false;
                clearInterval(state.timerInterval);
                if (document.pointerLockElement) document.exitPointerLock();
                state.targets.forEach(t => Game.destroyTarget(t));
                state.targets.length = 0;
                DOMElements.displays.hpBarFill.style.width = '100%';
                
                UI.updateRightPanelTab(state.rightPanelTab); 
                UI.showScreen('start');
                UI.updateHighscores(getActiveModeKey());
            },
            shoot() {
                if (state.gameMode === 'mode_tracking') return;
                
                state.totalShots++;
                raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
                const intersects = raycaster.intersectObjects(state.targets);
                
                const config = MODE_CONFIG[state.gameMode]; 

                if (DOMElements.audio.shoot && state.shootVolume > 0) {
                    const vol = state.shootVolume / 100; 
                    const sound = DOMElements.audio.shoot.cloneNode(); 
                    sound.volume = Math.min(Math.max(vol, 0), 1);
                    sound.play().catch(e => {});
                }

                if (intersects.length > 0) {
                    const hitTarget = intersects[0].object;
                    const lastHitPosition = hitTarget.position.clone();
                    const now = Date.now();
                    const reactionTime = now - state.lastHitTime;
                    state.reactionTimes.push(reactionTime);
                    
                    AimTelemetryManager.LogHit(lastHitPosition, reactionTime);
                    
                    state.lastHitTime = now;
                    
                    Game.destroyTarget(hitTarget);
                    state.targets = state.targets.filter(t => t !== hitTarget);
                    
                    state.hits++;

                    let currentHitScore = config.baseScore; 
                    if (state.gameMode === 'mode1') {
                        currentHitScore = (399 / (1 + Math.pow(reactionTime / 825, 1.5))) + 1;
                    } else if (state.gameMode === 'mode2') {
                        currentHitScore = (999 / (1 + Math.pow(reactionTime / 1450, 2))) + 1;
                    } else if (state.gameMode === 'mode_pos') {
                        currentHitScore = (699 / (1 + Math.pow(reactionTime / 1350, 1.4))) + 1;
                    } else if (state.gameMode === 'mode_ft') {
                        currentHitScore = (499 / (1 + Math.pow(reactionTime / 940, 1.26))) + 1;
                    }
                    
                    // 若為短時模式，基礎得分乘以 4
                    if (state.isShortMode) {
                        currentHitScore *= 4;
                    }

                    state.accumulatedBaseScore += currentHitScore;

                    if (DOMElements.audio.hit && state.hitVolume > 0) {
                        const vol = state.hitVolume / 100; 
                        const sound = DOMElements.audio.hit.cloneNode();
                        sound.volume = Math.min(Math.max(vol, 0), 1);
                        sound.play().catch(e => console.error("音效播放失敗:", e));
                    }

                    if (state.gameMode === 'mode_pos' || state.gameMode === 'mode_ft') {
                        state.posNextCenter = !hitTarget.userData.isCenter;
                    }

                    Game.createTarget(lastHitPosition);
                } else {
                    const clickDir = new THREE.Vector3();
                    camera.getWorldDirection(clickDir);
                    AimTelemetryManager.LogMiss(clickDir, state.targets);
                }

                if (state.totalShots > 0) {
                    const accuracy = state.hits / state.totalShots;
                    state.score = Math.round(state.accumulatedBaseScore * Math.sqrt(accuracy));
                } else {
                    state.score = 0;
                }

                UI.updateScore();
            },
            getNextPosAngle() {
                if (!state.posAnglesBag || state.posAnglesBag.length === 0) {
                    state.posAnglesBag = Array.from({length: 16}, (_, i) => i);
                    for (let i = state.posAnglesBag.length - 1; i > 0; i--) {
                        const j = Math.floor(Math.random() * (i + 1));
                        [state.posAnglesBag[i], state.posAnglesBag[j]] = [state.posAnglesBag[j], state.posAnglesBag[i]];
                    }
                }
                return state.posAnglesBag.pop() * (Math.PI / 8); 
            },
            spawnTrackingTarget() {
                const config = MODE_CONFIG.mode_tracking;
                
                // 使用 Shuffle Bag 確保不同尺寸均勻出現
                if (!state.trackingRadiusBag || state.trackingRadiusBag.length === 0) {
                    state.trackingRadiusBag = [0.4, 0.6, 0.8, 1.0, 1.2, 1.4];
                    for (let i = state.trackingRadiusBag.length - 1; i > 0; i--) {
                        const j = Math.floor(Math.random() * (i + 1));
                        [state.trackingRadiusBag[i], state.trackingRadiusBag[j]] = [state.trackingRadiusBag[j], state.trackingRadiusBag[i]];
                    }
                }
                const baseRadius = state.trackingRadiusBag.pop();
                const radius = Math.min(config.radiusMax, baseRadius + Math.random() * 0.2);

                // 從設定讀取速度與加速度並進行線性映射 (速度越快，加速度越小)
                const speedProgress = Math.random(); // 0 ~ 1 之間的隨機進度
                const speed = config.speedMin + speedProgress * (config.speedMax - config.speedMin); 
                const burstMult = config.burstMultMax - speedProgress * (config.burstMultMax - config.burstMultMin);

                const geometry = new THREE.SphereGeometry(radius, 32, 16);
                const material = new THREE.MeshStandardMaterial({ color: state.targetColor, emissive: new THREE.Color(state.targetColor).multiplyScalar(0.33) });
                const target = new THREE.Mesh(geometry, material);
                target.castShadow = true;
                const spawnZ = -ROOM_SIZE.depth / 2 + 1.5;
                target.position.set((Math.random() - 0.5) * 26, 6.6, spawnZ);
                target.userData = {
                    health: config.health, vx: 0, targetDir: Math.random() > 0.5 ? 1 : -1,
                    baseSpeed: speed, burstMult: burstMult,
                    currentBurst: 1.0, 
                    // 統一讀取 MODE_CONFIG 的轉向時間
                    nextDirChange: performance.now() + (Math.random() * (config.dirChangeMax - config.dirChangeMin) + config.dirChangeMin),
                    spawnTime: performance.now() // 新增：紀錄出生時間
                };
                scene.add(target);
                state.targets.push(target);
            },
            spawnPosTarget() {
                const config = MODE_CONFIG[state.gameMode];
                const radius = Math.random() * (config.radiusMax - config.radiusMin) + config.radiusMin;
                const geometry = new THREE.SphereGeometry(radius, 32, 16);
                const material = new THREE.MeshStandardMaterial({ color: state.targetColor, emissive: new THREE.Color(state.targetColor).multiplyScalar(0.33) });
                const target = new THREE.Mesh(geometry, material);
                target.castShadow = true;
                const z = -ROOM_SIZE.depth / 2 + 1;
                const centerY = 6.6;

                if (state.posNextCenter) {
                    target.position.set(0, centerY, z);
                    target.userData = { isCenter: true };
                } else {
                    const minR = config.spawnOffset !== undefined ? config.spawnOffset : (config.radiusMax * 2.5);
                    const w = config.spawnWidth  || 30;
                    const h = config.spawnHeight || 14;
                    const margin = radius + 0.5;
                    const angle = Game.getNextPosAngle();

                    let maxDx_box = Infinity, maxDy_box = Infinity;
                    if (Math.abs(Math.cos(angle)) > 0.0001) maxDx_box = (w / 2) / Math.abs(Math.cos(angle));
                    if (Math.abs(Math.sin(angle)) > 0.0001) maxDy_box = (h / 2) / Math.abs(Math.sin(angle));

                    let maxDx_room = Infinity, maxDy_room = Infinity;
                    if (Math.cos(angle) > 0.0001) {
                        maxDx_room = (ROOM_SIZE.width / 2 - margin) / Math.cos(angle);
                    } else if (Math.cos(angle) < -0.0001) {
                        maxDx_room = (-ROOM_SIZE.width / 2 + margin) / Math.cos(angle);
                    }
                    if (Math.sin(angle) > 0.0001) {
                        maxDy_room = (ROOM_SIZE.height - margin - centerY) / Math.sin(angle);
                    } else if (Math.sin(angle) < -0.0001) {
                        maxDy_room = (margin - centerY) / Math.sin(angle);
                    }

                    const maxD = Math.min(maxDx_box, maxDy_box, maxDx_room, maxDy_room);
                    let d = (maxD > minR) ? (minR + Math.random() * (maxD - minR)) : maxD;

                    target.position.set(d * Math.cos(angle), centerY + d * Math.sin(angle), z);
                    target.userData = { isCenter: false, expireTime: performance.now() + config.expireTime };
                }
                scene.add(target);
                state.targets.push(target);
            },
            spawnStandardTarget(lastHitPosition = null) {
                const config = MODE_CONFIG[state.gameMode];
                const targetRadius = config.targetRadius;
                
                const isMode2 = state.gameMode === 'mode2';
                
                // 若為一般模式(網格2.45)，要剛好產生 5x5 的排列(4個間隔)，生成區域寬高需動態設為 4 * 2.45 = 9.8
                // 若為爆頭模式，要產生 9x9 排列(8個間隔)，區域設為 12。最高點約 Y=13.1，完美限制在背景內
                const areaSize = isMode2 ? 12 : 9.8;
                
                const spawnArea = { 
                    width: areaSize, 
                    height: areaSize, 
                    z: -ROOM_SIZE.depth / 2 + targetRadius, 
                    // 一般模式上移 1.5 單位 (1.1 + 1.5 = 2.6)，爆頭模式改為上移 1 單位 (1.1 + 1.0 = 2.1)
                    yPadding: isMode2 ? 2.1 : 2.6 
                };

                const geometry = new THREE.SphereGeometry(targetRadius, 32, 16);
                const material = new THREE.MeshStandardMaterial({ 
                    color: state.targetColor, 
                    emissive: new THREE.Color(state.targetColor).multiplyScalar(0.33) 
                });
                const newTarget = new THREE.Mesh(geometry, material);
                newTarget.castShadow = true;
                
                // 一般模式半徑 0.95 (直徑 1.9) + 間隙 0.55 = 網格大小 2.45
                // 爆頭模式縮小間隙，網格大小設為 1.5 (12 / 1.5 = 8 段 = 9個點)
                const gridCellSize = isMode2 ? 1.5 : 2.45; 
                
                let currentMinDistance = isMode2 ? 1.5 : 2.45;
                const absoluteMinDistance = isMode2 ? 0.4 : 0.55; 
                
                const cols = Math.floor(spawnArea.width / gridCellSize);
                const rows = Math.floor(spawnArea.height / gridCellSize);
                
                const startX = -(cols * gridCellSize) / 2;
                const startY = spawnArea.yPadding + (spawnArea.height - (rows * gridCellSize)) / 2;

                let positionFound = false, attempts = 0;
                
                while (!positionFound && attempts < 300) {
                    attempts++;
                    
                    if (attempts > 50) {
                        currentMinDistance = Math.max(absoluteMinDistance, currentMinDistance - 0.5);
                    }
                    
                    const randomCol = Math.floor(Math.random() * (cols + 1));
                    const randomRow = Math.floor(Math.random() * (rows + 1));
                    
                    const x = startX + randomCol * gridCellSize;
                    const y = startY + randomRow * gridCellSize;
                    
                    newTarget.position.set(x, y, spawnArea.z);
                    
                    const tooClose = state.targets.some(t => newTarget.position.distanceTo(t.position) < currentMinDistance) ||
                                     (lastHitPosition && newTarget.position.distanceTo(lastHitPosition) < currentMinDistance);
                    
                    // 爆頭模式新增限制：同行同列不得大於等於 3 個 (代表目前畫面上該行或該列最多只能有 2 個)
                    let exceedLineLimit = false;
                    if (isMode2 && !tooClose) {
                        let sameColCount = 0;
                        let sameRowCount = 0;
                        state.targets.forEach(t => {
                            if (Math.abs(t.position.x - x) < 0.1) sameColCount++;
                            if (Math.abs(t.position.y - y) < 0.1) sameRowCount++;
                        });
                        if (sameColCount >= 2 || sameRowCount >= 2) {
                            exceedLineLimit = true;
                        }
                    }

                    if (!tooClose && !exceedLineLimit) {
                        positionFound = true;
                    }
                }
                
                if (!positionFound && lastHitPosition) {
                    newTarget.position.x += (Math.random() > 0.5 ? 1 : -1) * absoluteMinDistance;
                    newTarget.position.y += (Math.random() > 0.5 ? 1 : -1) * absoluteMinDistance;
                }

                scene.add(newTarget);
                state.targets.push(newTarget);
            },
            createTarget(lastHitPosition = null) {
                if (state.gameMode === 'mode_tracking') return Game.spawnTrackingTarget();
                if (state.gameMode === 'mode_pos' || state.gameMode === 'mode_ft') return Game.spawnPosTarget();
                Game.spawnStandardTarget(lastHitPosition);
            },
            saveScore(newScore, accuracy, avgReactionTime, avgScorePerHit) {
                const modeKey = getActiveModeKey();
                const key = `highscores_${modeKey}`;
                let scores = storage.get(key, []);
                
                const previousHigh = scores.length > 0 ? scores[0].score : 0;
                const isNewRecord = newScore > previousHigh;

                const dateTimeString = new Date().toLocaleString([], { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false });

                const newEntry = { score: newScore, date: dateTimeString, accuracy, avgReactionTime, avgScorePerHit };
                scores.push(newEntry);
                scores.sort((a, b) => b.score - a.score).splice(5);
                storage.set(key, scores);
                const isNewOnBoard = scores.some(s => s.date === newEntry.date && s.score === newEntry.score);
                UI.updateHighscores(modeKey, isNewOnBoard ? newEntry : null);
                
                const historyKey = `history_${modeKey}`;
                let historyData = storage.get(historyKey, []);
                // 擴充紀錄的結構，將本次單局的所有 shot data 一起存進 localStorage 提供分析用
                historyData.push({ score: newScore, accuracyValue: parseFloat(accuracy)/100, date: dateTimeString, shots: AimTelemetryManager.shots.slice() });
                if (historyData.length > 30) historyData.shift(); 
                storage.set(historyKey, historyData);
                
                const slicedData = historyData.slice(-state.historyScope);
                AimTelemetryManager.generateReport(slicedData);
                
                return isNewRecord;
            },
            clearHighScores() {
                const modeKey = getActiveModeKey();
                storage.set(`highscores_${modeKey}`, []);
                UI.updateHighscores(modeKey);
                
                storage.set(`history_${modeKey}`, []);
                AimTelemetryManager.generateReport([]);
            }
        };

        // --- 9. 事件處理 ---
        function setupEventListeners() {
            DOMElements.buttons.start.addEventListener('click', Game.resume);
            DOMElements.buttons.playAgain.addEventListener('click', Game.resume);
            DOMElements.buttons.backToMenu.addEventListener('click', Game.returnToMenu);
            DOMElements.buttons.menu.addEventListener('click', Game.returnToMenu);
            DOMElements.buttons.resume.addEventListener('click', Game.resume);
            DOMElements.buttons.restart.addEventListener('click', Game.restart);
            DOMElements.buttons.clearScores.forEach(btn => btn.addEventListener('click', e => { e.stopPropagation(); Game.clearHighScores(); }));

            DOMElements.buttons.settings.addEventListener('click', () => UI.showScreen('audioSettings'));
            DOMElements.buttons.closeSettings.addEventListener('click', () => UI.hideScreen('audioSettings'));

            // 處理切換狀態 - 分段控制器
            DOMElements.buttons.scopeCurrent.addEventListener('click', () => {
                DOMElements.buttons.scopeCurrent.classList.add('active');
                DOMElements.buttons.scopeHistory.classList.remove('active');
                AimTelemetryManager.currentScope = 'current';
                AimTelemetryManager.renderTelemetry();
            });
            DOMElements.buttons.scopeHistory.addEventListener('click', () => {
                DOMElements.buttons.scopeHistory.classList.add('active');
                DOMElements.buttons.scopeCurrent.classList.remove('active');
                AimTelemetryManager.currentScope = 'history';
                AimTelemetryManager.renderTelemetry();
            });

            if (DOMElements.buttons.panelFlipBtn) {
                DOMElements.buttons.panelFlipBtn.addEventListener('click', () => {
                    const nextTab = state.rightPanelTab === 'crosshair' ? 'analysis' : 'crosshair';
                    UI.updateRightPanelTab(nextTab);
                });
            }

            DOMElements.buttons.resetColors.addEventListener('click', () => {
                const defaultTheme = 'dark';
                const defaultTarget = '#ffffff';

                state.sceneTheme = defaultTheme;
                storage.set('sceneTheme', defaultTheme);
                if (DOMElements.inputs.sceneThemeSelect) DOMElements.inputs.sceneThemeSelect.value = defaultTheme;
                buildEnvironment();
                buildPreviewEnvironment();

                state.targetColor = defaultTarget;
                state.hitColorHex = calcHitColor(defaultTarget);
                storage.set('targetColor', defaultTarget);
                DOMElements.inputs.targetColorPicker.value = defaultTarget;
                
                const color = new THREE.Color(defaultTarget);
                const emissive = color.clone().multiplyScalar(0.33);
                
                if (previewSphere) {
                    previewSphere.material.color.set(color);
                    previewSphere.material.emissive.set(emissive);
                }
                
                state.targets.forEach(t => {
                    t.material.color.set(color);
                    t.material.emissive.set(emissive);
                });
            });

            // --- 新增：處理 Logo 圖片載入錯誤 (取代 HTML 中的 onerror) ---
            const logoIcon = document.getElementById('logo-icon');
            if (logoIcon) {
                logoIcon.addEventListener('error', function() {
                    this.style.display = 'none';
                });
            }

            // --- 新增：開始選項下拉選單事件 (取代 HTML 中的 onchange) ---
            const startOptionSelect = document.getElementById('start-option-select');
            const countdownContainer = document.getElementById('countdown-container'); 

            if (startOptionSelect) {
                startOptionSelect.addEventListener('change', (e) => {
                    const isCountdown = e.target.value === 'countdown';
                    if (countdownContainer) {
                        countdownContainer.style.display = isCountdown ? 'flex' : 'none';
                    }
                });
            }
            // -------------------------------------------------------------

            // --- 模式選擇切換 ---
            DOMElements.inputs.gameModeSelect.addEventListener('change', e => {
                state.gameMode = e.target.value;
                storage.set('gameMode', state.gameMode);
                UI.updateHighscores(getActiveModeKey());

                if (state.rightPanelTab === 'analysis' && DOMElements.displays.analysisPanel.parentNode === DOMElements.displays.rightColumn) {
                    const historyData = storage.get(`history_${getActiveModeKey()}`, []);
                    const slicedData = historyData.slice(-state.historyScope);
                    AimTelemetryManager.shots = [];
                    AimTelemetryManager.generateReport(slicedData);
                }
            });

            // --- 短時模式切換 ---
            DOMElements.inputs.shortModeToggle.addEventListener('change', e => {
                state.isShortMode = e.target.checked;
                storage.set('isShortMode', state.isShortMode);
                UI.populateModeSelector();
                DOMElements.inputs.gameModeSelect.value = state.gameMode;
                UI.updateHighscores(getActiveModeKey());

                if (state.rightPanelTab === 'analysis' && DOMElements.displays.analysisPanel.parentNode === DOMElements.displays.rightColumn) {
                    const historyData = storage.get(`history_${getActiveModeKey()}`, []);
                    const slicedData = historyData.slice(-state.historyScope);
                    AimTelemetryManager.shots = [];
                    AimTelemetryManager.generateReport(slicedData);
                }
            });

            if (DOMElements.inputs.historyScopeSelect) {
                DOMElements.inputs.historyScopeSelect.addEventListener('change', e => {
                    state.historyScope = parseInt(e.target.value);
                    storage.set('historyScope', state.historyScope);
                    Game.updateAnalysisScopeUI();
                });
            }

            DOMElements.inputs.fpsSelect.addEventListener('change', e => {
                state.showFps = (e.target.value === 'on');
                storage.set('showFps', state.showFps);
                DOMElements.displays.fpsDisplay.style.display = state.showFps ? 'block' : 'none';
            });

            if (DOMElements.inputs.debugSelect) {
                DOMElements.inputs.debugSelect.addEventListener('change', e => {
                    state.debugMode = (e.target.value === 'on');
                    storage.set('debugMode', state.debugMode);
                });
            }

            DOMElements.inputs.sensitivitySlider.addEventListener('input', e => {
                const config = PROFILE_CONFIG[state.currentProfile];
                const rate = (config && config.sensId) ? SENS_CONVERSION_RATES[config.sensId] : 1.0;
                Settings.applySensitivity(parseFloat(e.target.value) / rate);
            });

            DOMElements.inputs.sensitivityConversions.addEventListener('blur', e => {
                const target = e.target;
                if (target.isContentEditable) {
                    const game = target.dataset.game;
                    const value = parseFloat(target.textContent);
                    if (!isNaN(value) && value >= 0) {
                        Settings.applySensitivity(value / SENS_CONVERSION_RATES[game]);
                    } else {
                        Settings.applySensitivity(state.sensitivity);
                    }
                }
            }, true);
            
            DOMElements.inputs.fovPreset.addEventListener('change', e => {
                Settings.applyProfile(e.target.value);
            });

            DOMElements.inputs.aspectRatioSelect.addEventListener('change', e => {
                state.aspectRatio = e.target.value;
                storage.set('aspectRatio', state.aspectRatio);
                Settings.applyProfile(state.currentProfile); 
            });

            DOMElements.inputs.fovSlider.addEventListener('input', e => {
                const config = PROFILE_CONFIG[state.currentProfile];
                if (config && !config.fovFixed) {
                    Settings.applyFov(parseInt(e.target.value), false);
                }
            });

            DOMElements.inputs.fovValue.addEventListener('blur', e => {
                const config = PROFILE_CONFIG[state.currentProfile];
                if (config && config.fovFixed) return;
                
                const value = parseInt(e.target.textContent);
                if (!isNaN(value)) {
                    Settings.applyFov(value, false);
                } else {
                    Settings.applyFov(state.profileFovs[state.currentProfile], false);
                }
            });

            DOMElements.inputs.crosshairCustomizer.addEventListener('input', Settings.applyCrosshairStyle);

            if (DOMElements.inputs.sceneThemeSelect) {
                DOMElements.inputs.sceneThemeSelect.addEventListener('change', e => {
                    state.sceneTheme = e.target.value;
                    storage.set('sceneTheme', state.sceneTheme);
                    buildEnvironment();
                    buildPreviewEnvironment();
                });
            }

            if (DOMElements.inputs.targetColorPicker) {
                DOMElements.inputs.targetColorPicker.addEventListener('input', e => {
                    const hexColor = e.target.value;
                    state.targetColor = hexColor;
                    state.hitColorHex = calcHitColor(hexColor);
                    storage.set('targetColor', hexColor);

                    const color = new THREE.Color(hexColor);
                    const emissive = color.clone().multiplyScalar(0.33);

                    if (previewSphere) {
                        previewSphere.material.color.set(color);
                        previewSphere.material.emissive.set(emissive);
                    }
                    state.targets.forEach(t => {
                        t.material.color.set(color);
                        t.material.emissive.set(emissive);
                    });
                });
            }

            DOMElements.displays.sensValue.addEventListener('blur', e => {
                const config = PROFILE_CONFIG[state.currentProfile];
                if (!config || !config.sensId) return; 

                const val = parseFloat(e.target.textContent);
                if (!isNaN(val) && val >= 0) {
                    const rate = SENS_CONVERSION_RATES[config.sensId];
                    const baseSens = val / rate;
                    Settings.applySensitivity(baseSens);
                } else {
                    const baseSens = state.profileSensitivities[state.currentProfile];
                    Settings.applySensitivity(baseSens);
                }
            });

            const handleInputRestriction = (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    e.target.blur();
                    return;
                }
                const allowedKeys = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', '.', '-', 'Tab'];
                if (!allowedKeys.includes(e.key) && isNaN(e.key) && !e.ctrlKey && !e.metaKey) {
                    e.preventDefault();
                    return;
                }
                if (!allowedKeys.includes(e.key) && !e.ctrlKey && !e.metaKey && e.target.textContent.length >= 7 && document.getSelection().toString().length === 0) {
                    e.preventDefault();
                }
            };

            DOMElements.inputs.fovValue.addEventListener('keydown', handleInputRestriction);
            DOMElements.displays.sensValue.addEventListener('keydown', handleInputRestriction);
            document.querySelectorAll('#sensitivity-conversions span').forEach(span => {
                span.addEventListener('keydown', handleInputRestriction);
            });
            
            const tooltip = DOMElements.displays.chartTooltip;
            
            DOMElements.displays.trendChart.addEventListener('mousemove', e => {
                const canvas = e.target;
                const rect = canvas.getBoundingClientRect();
                // 修正：將 CSS 縮放後的滑鼠座標轉換為 Canvas 內的原始繪圖座標
                const scaleX = canvas.width / rect.width;
                const scaleY = canvas.height / rect.height;
                const x = (e.clientX - rect.left) * scaleX;
                const y = (e.clientY - rect.top) * scaleY;
                
                let found = null;
                AimTelemetryManager.trendHoverZones.forEach(z => {
                    // 修正：精確判斷游標與「分數點」或「命中率點」的距離 (半徑 10 pixel 內才顯示)
                    if (Math.hypot(z.x - x, z.y_score - y) < 10 || Math.hypot(z.x - x, z.y_acc - y) < 10) {
                        found = z;
                    }
                });
                
                if (found) {
                    tooltip.style.opacity = 1;
                    tooltip.style.left = (e.pageX + 15) + 'px';
                    tooltip.style.top = (e.pageY + 15) + 'px';
                    tooltip.innerHTML = `時間: ${found.date}<br><span style="color:#fff;">分數: ${found.score}</span><br><span style="color:var(--gold-primary);">命中率: ${(found.acc * 100).toFixed(1)}%</span>`;
                } else {
                    tooltip.style.opacity = 0;
                }
            });
            DOMElements.displays.trendChart.addEventListener('mouseleave', () => tooltip.style.opacity = 0);

            DOMElements.displays.radarChart.addEventListener('mousemove', e => {
                const canvas = e.target;
                const rect = canvas.getBoundingClientRect();
                const scaleX = canvas.width / rect.width;
                const scaleY = canvas.height / rect.height;
                const x = (e.clientX - rect.left) * scaleX;
                const y = (e.clientY - rect.top) * scaleY;
                
                let found = null;
                AimTelemetryManager.radarHoverZones.forEach(z => {
                    if (Math.hypot(z.x - x, z.y - y) < 15) found = z;
                });
                if (found) {
                    tooltip.style.opacity = 1;
                    tooltip.style.left = (e.pageX + 15) + 'px';
                    tooltip.style.top = (e.pageY + 15) + 'px';
                    tooltip.innerHTML = `<span style="font-weight:bold;">${found.label}向</span><br>反應時間: ${found.ttk}ms<br>樣本數: ${found.hits} 發`;
                } else {
                    tooltip.style.opacity = 0;
                }
            });
            DOMElements.displays.radarChart.addEventListener('mouseleave', () => tooltip.style.opacity = 0);

            DOMElements.displays.radarChartAcc.addEventListener('mousemove', e => {
                const canvas = e.target;
                const rect = canvas.getBoundingClientRect();
                const scaleX = canvas.width / rect.width;
                const scaleY = canvas.height / rect.height;
                const x = (e.clientX - rect.left) * scaleX;
                const y = (e.clientY - rect.top) * scaleY;
                
                let found = null;
                AimTelemetryManager.radarAccHoverZones.forEach(z => {
                    if (Math.hypot(z.x - x, z.y - y) < 15) found = z;
                });
                if (found) {
                    tooltip.style.opacity = 1;
                    tooltip.style.left = (e.pageX + 15) + 'px';
                    tooltip.style.top = (e.pageY + 15) + 'px';
                    tooltip.innerHTML = `<span style="font-weight:bold;">${found.label}向</span><br>命中率: ${found.acc}%<br>樣本數: ${found.total} 發`;
                } else {
                    tooltip.style.opacity = 0;
                }
            });
            DOMElements.displays.radarChartAcc.addEventListener('mouseleave', () => tooltip.style.opacity = 0);

            document.addEventListener('pointerlockchange', handlePointerLockChange);
            document.addEventListener('mousemove', handleMouseMove);
            
            // 攔截左鍵事件，加入等待點擊的邏輯
            window.addEventListener('mousedown', e => { 
                if (state.isPointerLocked && e.button === 0) {
                    if (state.isWaitingToStart) {
                        state.isWaitingToStart = false;
                        document.getElementById('game-start-overlay').classList.add('hidden');
                        document.getElementById('game-start-text').style.animation = 'none'; // reset animation
                        
                        const config = MODE_CONFIG[state.gameMode];
                        const gameDuration = state.isShortMode ? Math.max(1, Math.floor(config.duration / 4)) : config.duration;
                        Game.start(gameDuration);
                    } else if (state.gameActive) {
                        Game.shoot();
                    }
                } 
            });
            
            window.addEventListener('resize', onWindowResize);
            window.addEventListener('keydown', e => {
                if (e.key === ' ' && !e.target.isContentEditable) {
                    if (!DOMElements.screens.start.classList.contains('hidden') || !DOMElements.screens.gameOver.classList.contains('hidden')) {
                        if (!DOMElements.buttons.playAgain.disabled) {
                            Game.resume();
                        }
                    }
                }
            });
        }

        function handlePointerLockChange() {
            if (document.pointerLockElement === DOMElements.canvas) {
                state.isPointerLocked = true;
                if (!state.gameActive && !state.isWaitingToStart && !state.countdownInterval) {
                    Game.initSequence();
                } else if (state.gameActive && state.pauseStartTime > 0) { 
                    const pauseDuration = Date.now() - state.pauseStartTime;
                    state.lastHitTime += pauseDuration; 
                    
                    const perfPauseDuration = performance.now() - state.pauseStartPerfTime;
                    state.targets.forEach(t => {
                        if (t.userData.expireTime) t.userData.expireTime += perfPauseDuration;
                        if (t.userData.nextDirChange) t.userData.nextDirChange += perfPauseDuration;
                    });

                    state.lastFrameTime = performance.now();
                    state.pauseStartTime = 0;
                    state.pauseStartPerfTime = 0;
                    
                    UI.showScreen('game');
                    state.timerInterval = setInterval(() => {
                        state.timeLeft--;
                        UI.updateTimer();
                        if (state.timeLeft <= 0) Game.end();
                    }, 1000);
                }
            } else {
                state.isPointerLocked = false;
                if (state.countdownInterval) {
                    clearInterval(state.countdownInterval);
                    state.countdownInterval = null;
                    Game.cancelSequence();
                } else if (state.isWaitingToStart) {
                    Game.cancelSequence();
                } else if (state.gameActive) {
                    Game.pause();
                }
            }
        }

        function handleMouseMove(event) {
            if (!state.isPointerLocked) return;
            euler.setFromQuaternion(camera.quaternion);
            euler.y -= event.movementX * 0.002 * state.sensitivity;
            euler.x -= event.movementY * 0.002 * state.sensitivity;
            euler.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, euler.x));
            camera.quaternion.setFromEuler(euler);
        }
        
        function onWindowResize() {
            const aspect = window.innerWidth / window.innerHeight;
            camera.aspect = aspect;
            camera.fov = hfovToVfov(state.targetHfov, aspect); 
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        }

        function updateGridCanvas(colorHex) {
            if (!gridCanvas) {
                gridCanvas = document.createElement('canvas');
                gridCanvas.width = 512; 
                gridCanvas.height = 512;
            }
            const size = 512, divisions = 10;
            const ctx = gridCanvas.getContext('2d');
            
            ctx.fillStyle = colorHex;
            ctx.fillRect(0, 0, size, size);

            const hex = colorHex.replace('#', '');
            const r = parseInt(hex.substring(0,2), 16);
            const g = parseInt(hex.substring(2,4), 16);
            const b = parseInt(hex.substring(4,6), 16);
            const luminance = 0.299*r + 0.587*g + 0.114*b;
            ctx.strokeStyle = luminance > 128 ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.1)';
            ctx.lineWidth = 2;

            const step = size / divisions;
            ctx.beginPath();
            for (let i = 0; i <= divisions; i++) {
                const pos = i * step;
                ctx.moveTo(pos, 0); ctx.lineTo(pos, size);
                ctx.moveTo(0, pos); ctx.lineTo(size, pos);
            }
            ctx.stroke();
        }

        function createWallMaterial(repeatX, repeatY) {
            const texture = new THREE.CanvasTexture(gridCanvas);
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;
            texture.repeat.set(repeatX, repeatY);
            activeTextures.push(texture); 
            return new THREE.MeshStandardMaterial({ map: texture }); 
        }

        function updateGridColor(colorHex) {
            updateGridCanvas(colorHex);
            activeTextures.forEach(t => t.needsUpdate = true);
        }

        function resizePreviewCanvas() {
            const canvas = DOMElements.displays.previewCanvas;
            const parent = canvas.parentElement;
            if (!parent) return;
            const width = parent.clientWidth;
            const height = parent.clientHeight;
            if (width === 0 || height === 0) return;
            
            previewRenderer.setSize(width, height, false);
            previewCamera.aspect = width / height;
            previewCamera.updateProjectionMatrix();
        }

        let envGroup;
        function buildEnvironment() {
            if (envGroup) {
                scene.remove(envGroup);
                envGroup.children.forEach(child => {
                    if (child.geometry) child.geometry.dispose();
                    if (child.material) {
                        if (child.material.map) child.material.map.dispose();
                        child.material.dispose();
                    }
                });
            }
            envGroup = new THREE.Group();

            activeTextures.forEach(t => t.dispose());
            activeTextures = [];

            // 確保清除先前的霧效
            scene.fog = null;

            const backWallZ = -ROOM_SIZE.depth / 2 - 8;
            const extendedDepth = ROOM_SIZE.depth + 8;
            const extendedCenterZ = -4;

            if (state.sceneTheme === 'space') {
                scene.background = new THREE.Color(0x050508); 
                scene.fog = new THREE.FogExp2(0x050508, 0.015);

                if (ambientLight) ambientLight.intensity = 1.0;
                if (hemiLight) hemiLight.intensity = 1.0;
                if (dirLight) dirLight.intensity = 1.8;

                const createMat = (hexColor) => new THREE.MeshStandardMaterial({ 
                    color: hexColor || 0x050508, 
                    roughness: 0.8,  
                    metalness: 0.1
                });

                const floor = new THREE.Mesh(new THREE.PlaneGeometry(ROOM_SIZE.width, extendedDepth), createMat());
                floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; floor.position.z = extendedCenterZ;
                envGroup.add(floor);

                const wallPositions = [
                    { geo: new THREE.PlaneGeometry(ROOM_SIZE.width, ROOM_SIZE.height), pos: [0, ROOM_SIZE.height / 2, backWallZ], rot: [0, 0, 0] },
                    { geo: new THREE.PlaneGeometry(ROOM_SIZE.width, ROOM_SIZE.height), pos: [0, ROOM_SIZE.height / 2, ROOM_SIZE.depth / 2], rot: [0, Math.PI, 0] },
                    { geo: new THREE.PlaneGeometry(extendedDepth, ROOM_SIZE.height), pos: [-ROOM_SIZE.width / 2, ROOM_SIZE.height / 2, extendedCenterZ], rot: [0, Math.PI / 2, 0] },
                    { geo: new THREE.PlaneGeometry(extendedDepth, ROOM_SIZE.height), pos: [ROOM_SIZE.width / 2, ROOM_SIZE.height / 2, extendedCenterZ], rot: [0, -Math.PI / 2, 0] },
                ];
                wallPositions.forEach(w => {
                    const wall = new THREE.Mesh(w.geo, createMat());
                    wall.position.set(...w.pos); wall.rotation.set(...w.rot);
                    envGroup.add(wall);
                });

                // 星空粒子系統
                const starCount = 8000;
                const starGeo = new THREE.BufferGeometry();
                const starPos = new Float32Array(starCount * 3);
                for (let i = 0; i < starCount; i++) {
                    const radius = 100 + Math.random() * 300; 
                    const theta = Math.random() * 2 * Math.PI; 
                    const phi = Math.acos(Math.random()); 

                    const x = radius * Math.sin(phi) * Math.cos(theta);
                    const y = radius * Math.cos(phi) + ROOM_SIZE.height; // 確保在牆壁之上
                    const z = radius * Math.sin(phi) * Math.sin(theta);

                    starPos[i * 3] = x;
                    starPos[i * 3 + 1] = y;
                    starPos[i * 3 + 2] = z;
                }
                starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
                const starMat = new THREE.PointsMaterial({
                    color: 0xffffff,
                    size: 5.0, 
                    sizeAttenuation: false, 
                    transparent: true,
                    opacity: 1.0
                });
                const stars = new THREE.Points(starGeo, starMat);
                envGroup.add(stars);

            } else if (state.sceneTheme === 'dark') {
                scene.background = new THREE.Color(0x020203); 
                if (ambientLight) ambientLight.intensity = 1.0;
                if (hemiLight) hemiLight.intensity = 1.2;
                if (dirLight) dirLight.intensity = 1.8;

                const createMat = () => new THREE.MeshStandardMaterial({ color: 0x050508, roughness: 0.8, metalness: 0.1 });

                const floor = new THREE.Mesh(new THREE.PlaneGeometry(ROOM_SIZE.width, extendedDepth), createMat());
                floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; floor.position.z = extendedCenterZ;
                envGroup.add(floor);

                const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(ROOM_SIZE.width, extendedDepth), createMat());
                ceiling.rotation.x = Math.PI / 2; ceiling.position.y = ROOM_SIZE.height; ceiling.position.z = extendedCenterZ;
                envGroup.add(ceiling);
                
                const wallPositions = [
                    { geo: new THREE.PlaneGeometry(ROOM_SIZE.width, ROOM_SIZE.height), pos: [0, ROOM_SIZE.height / 2, backWallZ], rot: [0, 0, 0] },
                    { geo: new THREE.PlaneGeometry(ROOM_SIZE.width, ROOM_SIZE.height), pos: [0, ROOM_SIZE.height / 2, ROOM_SIZE.depth / 2], rot: [0, Math.PI, 0] },
                    { geo: new THREE.PlaneGeometry(extendedDepth, ROOM_SIZE.height), pos: [-ROOM_SIZE.width / 2, ROOM_SIZE.height / 2, extendedCenterZ], rot: [0, Math.PI / 2, 0] },
                    { geo: new THREE.PlaneGeometry(extendedDepth, ROOM_SIZE.height), pos: [ROOM_SIZE.width / 2, ROOM_SIZE.height / 2, extendedCenterZ], rot: [0, -Math.PI / 2, 0] },
                ];
                wallPositions.forEach(w => {
                    const wall = new THREE.Mesh(w.geo, createMat());
                    wall.position.set(...w.pos); wall.rotation.set(...w.rot);
                    envGroup.add(wall);
                });

                const decorMat = new THREE.MeshStandardMaterial({ color: 0x0a0a10, roughness: 0.8, metalness: 0.1 });
                const ledge1 = new THREE.Mesh(new THREE.BoxGeometry(ROOM_SIZE.width, 6, 4), decorMat);
                ledge1.position.set(0, 3, backWallZ + 2);
                envGroup.add(ledge1);

                const ledge2 = new THREE.Mesh(new THREE.BoxGeometry(ROOM_SIZE.width, 2.5, 2), decorMat);
                ledge2.position.set(0, 7.25, backWallZ + 1);
                envGroup.add(ledge2);

                for(let i = 0; i < 2; i++) {
                    const pillarL = new THREE.Mesh(new THREE.BoxGeometry(3, ROOM_SIZE.height, 4), decorMat);
                    pillarL.position.set(-ROOM_SIZE.width/2 + 1.5, ROOM_SIZE.height/2, backWallZ + 2 + i*5);
                    envGroup.add(pillarL);

                    const pillarR = new THREE.Mesh(new THREE.BoxGeometry(3, ROOM_SIZE.height, 4), decorMat);
                    pillarR.position.set(ROOM_SIZE.width/2 - 1.5, ROOM_SIZE.height/2, backWallZ + 2 + i*5);
                    envGroup.add(pillarR);
                }
            } else {
                scene.background = new THREE.Color(0x1a1a1a);
                if (ambientLight) ambientLight.intensity = 0.5;
                if (hemiLight) hemiLight.intensity = 0.8;
                if (dirLight) dirLight.intensity = 0; // 關閉方向光以還原舊版 MVP 視覺

                updateGridCanvas('#444444');
                const floor = new THREE.Mesh(new THREE.PlaneGeometry(ROOM_SIZE.width, ROOM_SIZE.depth), createWallMaterial(ROOM_SIZE.width / 5, ROOM_SIZE.depth / 5));
                floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; 
                envGroup.add(floor);
                
                const wallPositions = [
                    { geo: new THREE.PlaneGeometry(ROOM_SIZE.width, ROOM_SIZE.height), pos: [0, ROOM_SIZE.height / 2, -ROOM_SIZE.depth / 2], rot: [0, 0, 0], repeat: [ROOM_SIZE.width / 5, ROOM_SIZE.height / 5] },
                    { geo: new THREE.PlaneGeometry(ROOM_SIZE.width, ROOM_SIZE.height), pos: [0, ROOM_SIZE.height / 2, ROOM_SIZE.depth / 2], rot: [0, Math.PI, 0], repeat: [ROOM_SIZE.width / 5, ROOM_SIZE.height / 5] },
                    { geo: new THREE.PlaneGeometry(ROOM_SIZE.depth, ROOM_SIZE.height), pos: [-ROOM_SIZE.width / 2, ROOM_SIZE.height / 2, 0], rot: [0, Math.PI / 2, 0], repeat: [ROOM_SIZE.depth / 5, ROOM_SIZE.height / 5] },
                    { geo: new THREE.PlaneGeometry(ROOM_SIZE.depth, ROOM_SIZE.height), pos: [ROOM_SIZE.width / 2, ROOM_SIZE.height / 2, 0], rot: [0, -Math.PI / 2, 0], repeat: [ROOM_SIZE.depth / 5, ROOM_SIZE.height / 5] },
                ];
                wallPositions.forEach(w => {
                    const wall = new THREE.Mesh(w.geo, createWallMaterial(...w.repeat));
                    wall.position.set(...w.pos); wall.rotation.set(...w.rot);
                    envGroup.add(wall);
                });
            }
            scene.add(envGroup);
        }

        function initThreeJS() {
            scene = new THREE.Scene();
            const aspect = window.innerWidth / window.innerHeight;
            const vfov = hfovToVfov(state.targetHfov, aspect); 
            camera = new THREE.PerspectiveCamera(vfov, aspect, 0.1, 1000);

            renderer = new THREE.WebGLRenderer({ canvas: DOMElements.canvas, antialias: true });
            renderer.setSize(window.innerWidth, window.innerHeight);
            renderer.setPixelRatio(window.devicePixelRatio);
            renderer.shadowMap.enabled = true;
            raycaster = new THREE.Raycaster();
            
            ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
            scene.add(ambientLight);
            hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1.2);
            hemiLight.position.set(0, ROOM_SIZE.height, 0);
            scene.add(hemiLight);

            dirLight = new THREE.DirectionalLight(0xffffff, 1.8);
            dirLight.position.set(0, 15, 10);
            scene.add(dirLight);

            buildEnvironment();
        }

        let previewEnvGroup;
        function buildPreviewEnvironment() {
            if (previewEnvGroup) {
                previewScene.remove(previewEnvGroup);
                previewEnvGroup.children.forEach(child => {
                    if (child.geometry) child.geometry.dispose();
                    if (child.material) {
                        if (child.material.map) child.material.map.dispose();
                        child.material.dispose();
                    }
                });
            }
            previewEnvGroup = new THREE.Group();

            // 確保清除預覽場景先前的霧效
            previewScene.fog = null;

            if (state.sceneTheme === 'space') {
                previewScene.background = new THREE.Color(0x050508);
                previewScene.fog = new THREE.FogExp2(0x050508, 0.015);
                if (previewAmbientLight) previewAmbientLight.intensity = 1.0;
                if (previewHemiLight) previewHemiLight.intensity = 1.0;
                if (previewDirLight) previewDirLight.intensity = 1.8;

                const createMat = () => new THREE.MeshStandardMaterial({ color: 0x050508, roughness: 0.8, metalness: 0.1 });
                const previewWall = new THREE.Mesh(new THREE.PlaneGeometry(20, 20), createMat());
                previewWall.position.z = -2;
                previewEnvGroup.add(previewWall);
            } else if (state.sceneTheme === 'dark') {
                previewScene.background = new THREE.Color(0x020203);
                if (previewAmbientLight) previewAmbientLight.intensity = 1.0;
                if (previewHemiLight) previewHemiLight.intensity = 1.2;
                if (previewDirLight) previewDirLight.intensity = 1.0;

                const createMat = () => new THREE.MeshStandardMaterial({ color: 0x050508, roughness: 0.8, metalness: 0.1 });
                const previewWall = new THREE.Mesh(new THREE.PlaneGeometry(20, 20), createMat());
                previewWall.position.z = -2;
                previewEnvGroup.add(previewWall);
            } else {
                previewScene.background = new THREE.Color(0x1a1a1a);
                if (previewAmbientLight) previewAmbientLight.intensity = 0.5;
                if (previewHemiLight) previewHemiLight.intensity = 0.8;
                if (previewDirLight) previewDirLight.intensity = 0;

                updateGridCanvas('#444444');
                const previewWall = new THREE.Mesh(new THREE.PlaneGeometry(20, 20), createWallMaterial(4, 4));
                previewWall.position.z = -2;
                previewEnvGroup.add(previewWall);
            }
            previewScene.add(previewEnvGroup);
        }

        function initPreviewThreeJS() {
            const canvas = DOMElements.displays.previewCanvas;
            previewRenderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
            previewRenderer.setPixelRatio(window.devicePixelRatio);
            
            previewScene = new THREE.Scene();
            
            previewCamera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
            previewCamera.position.z = 2.5;

            previewAmbientLight = new THREE.AmbientLight(0xffffff, 1.0);
            previewScene.add(previewAmbientLight);
            previewHemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1.2);
            previewHemiLight.position.set(0, 10, 0);
            previewScene.add(previewHemiLight);
            previewDirLight = new THREE.DirectionalLight(0xffffff, 1.0);
            previewDirLight.position.set(0, 5, 5);
            previewScene.add(previewDirLight);

            buildPreviewEnvironment();

            const geometry = new THREE.SphereGeometry(0.8, 32, 16);
            const material = new THREE.MeshStandardMaterial({ 
                color: state.targetColor, 
                emissive: new THREE.Color(state.targetColor).multiplyScalar(0.33) 
            });
            previewSphere = new THREE.Mesh(geometry, material);
            previewScene.add(previewSphere);
        }

        let fpsLastTime = performance.now();
        let fpsFrames = 0;

        function updateTracking(now, dt) {
            const t = state.targets[0];
            if (!t) return;
            const config = MODE_CONFIG.mode_tracking;

            if (now > t.userData.nextDirChange) {
                t.userData.targetDir *= -1;
                t.userData.currentBurst = t.userData.burstMult;
                t.userData.nextDirChange = now + (Math.random() * (config.dirChangeMax - config.dirChangeMin) + config.dirChangeMin);
            }

            t.userData.currentBurst += (1.0 - t.userData.currentBurst) * config.burstDecay * dt;
            const targetVx = t.userData.targetDir * t.userData.baseSpeed * t.userData.currentBurst;
            t.userData.vx += (targetVx - t.userData.vx) * TRACKING_VX_SMOOTH * dt;
            t.position.x += t.userData.vx * dt;
            if (t.position.x >  15) { t.position.x =  15; t.userData.targetDir = -1; t.userData.currentBurst = t.userData.burstMult; }
            if (t.position.x < -15) { t.position.x = -15; t.userData.targetDir =  1; t.userData.currentBurst = t.userData.burstMult; }

            DOMElements.displays.hpBarContainer.classList.remove('hidden');
            const abovePos = t.position.clone();
            abovePos.y += t.geometry.parameters.radius + HP_BAR_Y_OFFSET;
            abovePos.project(camera);

            const centerProj = t.position.clone().project(camera);
            const edgeProj   = t.position.clone();
            edgeProj.x += t.geometry.parameters.radius;
            edgeProj.project(camera);
            const pixelRadius = Math.abs(edgeProj.x - centerProj.x) * 0.5 * window.innerWidth;
            const barWidth = Math.max(HP_BAR_MIN_WIDTH, pixelRadius * HP_BAR_WIDTH_MULT);

            if (abovePos.z < 1) {
                const screenX = (abovePos.x * 0.5 + 0.5) * window.innerWidth;
                const screenY = (abovePos.y * -0.5 + 0.5) * window.innerHeight;
                DOMElements.displays.hpBarContainer.style.transform = `translate(${screenX - barWidth / 2}px, ${screenY}px)`;
                DOMElements.displays.hpBarContainer.style.width      = `${barWidth}px`;
                DOMElements.displays.hpBarContainer.style.opacity    = '1';
            } else {
                DOMElements.displays.hpBarContainer.style.opacity = '0';
            }

            raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
            const intersects = raycaster.intersectObject(t);
            const frameDeltaMs = dt * 1000;

            if (intersects.length > 0) {
                t.material.color.setHex(state.hitColorHex);
                t.material.emissive.setHex(state.hitColorHex).multiplyScalar(0.33);
                t.userData.health -= frameDeltaMs;
                
                let scoreGain = (config.scorePerHit / 100) * frameDeltaMs;
                if (state.isShortMode) scoreGain *= 4;
                state.score += scoreGain;
                state.trackingTimeOnTarget += frameDeltaMs;

                if (now - state.lastTrackingTick > TRACKING_TICK_INTERVAL) {
                    state.lastTrackingTick = now;
                    if (DOMElements.audio.hit && state.hitVolume > 0) {
                        const vol = state.hitVolume / 100;
                        const sound = DOMElements.audio.hit.cloneNode();
                        sound.volume = Math.min(Math.max(vol, 0), 1);
                        sound.playbackRate = 2.0;
                        sound.play().catch(e => {});
                    }
                }
                if (t.userData.health <= 0) {
                    const lifespan = performance.now() - t.userData.spawnTime;
                    state.reactionTimes.push(lifespan); // 將存活時間(擊殺時間)加入陣列以便結算平均

                    const lastPos = t.position.clone();
                    Game.destroyTarget(t);
                    state.targets = [];
                    DOMElements.displays.hpBarFill.style.width = '100%';
                    DOMElements.displays.hpBarContainer.classList.add('hidden');
                    Game.createTarget(lastPos);
                } else {
                    DOMElements.displays.hpBarFill.style.width = `${(t.userData.health / config.health) * 100}%`;
                }
            } else {
                t.material.color.set(new THREE.Color(state.targetColor));
                t.material.emissive.set(new THREE.Color(state.targetColor).multiplyScalar(0.33));
                
                let scoreLoss = (config.scorePenalty / 100) * frameDeltaMs;
                if (state.isShortMode) scoreLoss *= 4;
                state.score = Math.max(0, state.score - scoreLoss);
            }
            UI.updateScore();
        }

        function updatePosExpiry(now) {
            if (state.targets.length === 0) return;
            const t = state.targets[0];
            if (now > t.userData.expireTime) {
                Game.destroyTarget(t);
                state.targets = [];
                state.posNextCenter = true;
                
                const clickDir = new THREE.Vector3();
                camera.getWorldDirection(clickDir);
                AimTelemetryManager.LogMiss(clickDir, []); 
                
                DOMElements.displays.damageOverlay.classList.add('active');
                setTimeout(() => DOMElements.displays.damageOverlay.classList.remove('active'), DAMAGE_FLASH_DURATION);
                Game.createTarget();
            }
        }

        function animate(now) {
            requestAnimationFrame(animate);
            if (!now) now = performance.now();
            
            const dt = (now - state.lastFrameTime) / 1000;
            state.lastFrameTime = now;

            if (state.gameActive && !state.pauseStartTime) {
                state.elapsedMs += dt * 1000; // 更新經歷的時間 (用於即時命中率計算)
                camera.updateMatrixWorld();

                if (state.gameMode === 'mode_tracking' && state.targets.length > 0) {
                    updateTracking(now, dt);
                } else {
                    DOMElements.displays.hpBarContainer.classList.add('hidden');
                }

                if ((state.gameMode === 'mode_pos' || state.gameMode === 'mode_ft') && !state.posNextCenter) {
                    updatePosExpiry(now);
                }
            }

            renderer.render(scene, camera);

            if (state.showFps) {
                fpsFrames++;
                if (now >= fpsLastTime + 1000) {
                    const currentFps = Math.round((fpsFrames * 1000) / (now - fpsLastTime));
                    if (DOMElements.displays.fpsDisplay) {
                        DOMElements.displays.fpsDisplay.textContent = `${currentFps} FPS`;
                    }
                    fpsFrames = 0;
                    fpsLastTime = now;
                }
            }

            if (previewRenderer && !DOMElements.screens.audioSettings.classList.contains('hidden')) {
                previewSphere.rotation.y += 0.01;
                previewSphere.rotation.x += 0.005;
                previewRenderer.render(previewScene, previewCamera);
            }
        }

        function main() {
            storage.checkScoreVersion(); 
            
            UI.populateModeSelector();
            initThreeJS();
            initPreviewThreeJS();
            Settings.load();
            setupEventListeners();
            UI.updateHighscores(getActiveModeKey());
            UI.showScreen('start');
            animate();
        }

        main();