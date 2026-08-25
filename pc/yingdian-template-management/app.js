(function () {
  "use strict";

  const STORAGE_KEY = "yingdian-template-standalone-prototype-v1";
  const pageType = document.body.dataset.page;
  let memoryTemplates = null;
  let toastTimer = null;
  let confirmCallback = null;
  let activeResultId = null;
  let demoState = "normal";
  let selectedUploadImage = "";
  let selectedUploadFileName = "";
  let detailTemplateId = "";
  let initialUsage = "";
  let initialMarkdown = "";
  let allowNavigation = false;

  const seededTemplates = [
    {
      id: "YD-TPL-001",
      name: "住进风景里",
      material: "朋友圈海报",
      image: "assets/hotel-room.jpg",
      publishStatus: "published",
      inferenceStatus: "success",
      revision: 3,
      revisionUpdatedAt: "2026-08-20 09:26",
      createdAt: "2026-08-18 09:40",
      updatedAt: "2026-08-20 09:26",
      usage: "适合突出酒店环境与住宿氛围的朋友圈宣传图。建议准备一张具有空间感的酒店主图，并提供简短、明确的宣传主题。",
      markdown: "# 住进风景里\n\n## 模板定位\n- 物料类型：朋友圈海报\n- 核心目标：突出住宿环境与度假氛围\n\n## 内容角色\n- 主标题：一句核心住宿主张\n- 辅助信息：活动或产品补充说明\n- 主图：酒店环境或客房空间\n\n## 视觉关系\n- 主图承担主要氛围\n- 标题保持高识别度\n- 装饰元素不遮挡主体信息\n\n## 输出要求\n- 保持完整海报构图\n- 文字与图片关系清晰",
      pendingResult: null,
      pendingKind: null
    },
    {
      id: "YD-TPL-002",
      name: "早餐慢时光",
      material: "电子活动海报",
      image: "assets/hotel-dining.jpg",
      publishStatus: "unpublished",
      inferenceStatus: "success",
      revision: 1,
      revisionUpdatedAt: "2026-08-20 08:52",
      createdAt: "2026-08-19 11:16",
      updatedAt: "2026-08-20 08:52",
      usage: "适合早餐体验、餐饮活动或轻松生活方式主题。建议使用明亮的餐饮空间或食物主图。",
      markdown: "# 早餐慢时光\n\n## 模板定位\n- 物料类型：电子活动海报\n- 核心目标：传达轻松、明亮的早餐体验\n\n## 内容角色\n- 主标题：早餐主题\n- 辅助信息：活动时间与简要说明\n- 主图：早餐或餐饮空间\n\n## 视觉关系\n- 保留自然光和舒展留白\n- 信息层级从主题到活动说明",
      pendingResult: {
        usage: "适合早餐体验、餐厅活动或晨间生活方式主题。优先准备自然光充足的餐饮空间或早餐主图，并使用简洁活动标题。",
        markdown: "# 早餐慢时光\n\n## 模板定位\n- 物料类型：电子活动海报\n- 核心目标：通过晨间光线与餐饮场景传达轻松体验\n\n## 内容角色\n- 主标题：早餐或晨间活动主题\n- 辅助信息：活动时间、地点与简要利益点\n- 主图：早餐餐台、餐厅空间或食物近景\n\n## 视觉关系\n- 主标题置于高留白区域\n- 主图保持自然光与空间纵深\n- 活动信息与标题建立清晰层级\n\n## 输出要求\n- 保持完整活动海报构图\n- 避免装饰元素遮挡核心食物或空间"
      },
      pendingKind: "reinference"
    },
    {
      id: "YD-TPL-003",
      name: "星光晚宴邀请函",
      material: "邀请函",
      image: "assets/hotel-night.jpg",
      publishStatus: "disabled",
      inferenceStatus: "failed",
      revision: 2,
      revisionUpdatedAt: "2026-08-19 17:34",
      createdAt: "2026-08-17 15:08",
      updatedAt: "2026-08-19 17:34",
      usage: "适合晚宴、会员活动或节日主题邀请。建议准备具有夜间氛围的酒店场景图。",
      markdown: "# 星光晚宴邀请函\n\n## 模板定位\n- 物料类型：邀请函\n- 核心目标：传达正式而有氛围感的活动邀请\n\n## 内容角色\n- 主标题：活动名称\n- 辅助信息：日期、地点与邀请说明\n- 主图：夜景或晚宴空间\n\n## 视觉关系\n- 深色主图与高对比文字\n- 日期和地点清晰可读",
      pendingResult: null,
      pendingKind: null
    }
  ];

  function cloneSeededTemplates() {
    return JSON.parse(JSON.stringify(seededTemplates));
  }

  function loadTemplates() {
    if (memoryTemplates) {
      return memoryTemplates;
    }

    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          let needsMigration = false;
          memoryTemplates = parsed.map(function (template) {
            if (typeof template.revisionUpdatedAt === "string") {
              return template;
            }
            needsMigration = true;
            return Object.assign({}, template, {
              revisionUpdatedAt: Number(template.revision || 0) > 0 ? template.updatedAt || template.createdAt || "" : ""
            });
          });
          if (needsMigration) {
            persistTemplates();
          }
          return memoryTemplates;
        }
      }
    } catch (error) {
      console.warn("Unable to load prototype state", error);
    }

    memoryTemplates = cloneSeededTemplates();
    persistTemplates();
    return memoryTemplates;
  }

  function persistTemplates() {
    if (!memoryTemplates) {
      return;
    }

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(memoryTemplates));
    } catch (error) {
      console.warn("Unable to persist prototype state", error);
    }
  }

  function resetTemplates() {
    memoryTemplates = cloneSeededTemplates();
    persistTemplates();
    renderCurrentPage(true);
    showToast("演示数据已重置");
  }

  function findTemplate(templateId) {
    return loadTemplates().find(function (template) {
      return template.id === templateId;
    });
  }

  function escapeHTML(value) {
    return String(value == null ? "" : value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function formatRevision(template) {
    return template.revision > 0 ? "第 " + template.revision + " 版" : "未生成";
  }

  function formatNow() {
    const now = new Date();
    const parts = new Intl.DateTimeFormat("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    }).formatToParts(now);
    const values = {};
    parts.forEach(function (part) {
      values[part.type] = part.value;
    });
    return values.year + "-" + values.month + "-" + values.day + " " + values.hour + ":" + values.minute;
  }

  function publishMeta(status) {
    const values = {
      unpublished: { label: "未发布", className: "unpublished" },
      published: { label: "已发布", className: "published" },
      disabled: { label: "已停用", className: "disabled" }
    };
    return values[status] || values.unpublished;
  }

  function inferenceMeta(template) {
    if (template.pendingResult) {
      return { label: "成功 · 待确认", className: "pending-review" };
    }

    const values = {
      pending: { label: "待处理", className: "pending" },
      processing: { label: "处理中", className: "processing" },
      success: { label: "成功", className: "success" },
      failed: { label: "失败", className: "failed" }
    };
    return values[template.inferenceStatus] || values.pending;
  }

  function statusBadge(label, className) {
    return '<span class="status-badge ' + escapeHTML(className) + '">' + escapeHTML(label) + "</span>";
  }

  function inferenceBadge(template, inference) {
    if (!template.pendingResult) {
      return statusBadge(inference.label, inference.className);
    }
    return '<button class="status-badge pending-review status-action" type="button" data-action="view-result" data-id="' + escapeHTML(template.id) + '">' + escapeHTML(inference.label) + "</button>";
  }

  function isInferenceLocked(template) {
    return template.inferenceStatus === "pending" || template.inferenceStatus === "processing" || Boolean(template.pendingResult);
  }

  function publicationAction(template) {
    if (template.publishStatus === "published") {
      return { label: "停用", action: "disable", className: "danger" };
    }
    if (template.publishStatus === "disabled") {
      return { label: "重新发布", action: "republish", className: "" };
    }
    return { label: "发布", action: "publish", className: "" };
  }

  function renderList() {
    const tableRegion = document.getElementById("table-region");
    const stateLayer = document.getElementById("list-state");
    const tableBody = document.getElementById("template-table-body");
    if (!tableRegion || !stateLayer || !tableBody) {
      return;
    }

    if (demoState !== "normal") {
      renderListState(demoState);
      return;
    }

    stateLayer.hidden = true;
    tableRegion.hidden = false;
    const templates = loadTemplates();

    if (templates.length === 0) {
      renderListState("empty");
      return;
    }

    tableBody.innerHTML = templates.map(function (template) {
      const publication = publishMeta(template.publishStatus);
      const inference = inferenceMeta(template);
      const publishAction = publicationAction(template);
      const locked = isInferenceLocked(template);

      return "<tr>" +
        "<td><div class=\"template-identity\">" +
          '<div class="template-thumb"><img src="' + escapeHTML(template.image) + '" alt=""></div>' +
          '<div class="template-identity-copy"><strong>' + escapeHTML(template.name) + "</strong><span>" + escapeHTML(template.id) + "</span></div>" +
        "</div></td>" +
        "<td>" + escapeHTML(template.material) + "</td>" +
        "<td>" + statusBadge(publication.label, publication.className) + "</td>" +
        "<td>" + inferenceBadge(template, inference) + "</td>" +
        '<td><span class="revision-badge">' + escapeHTML(formatRevision(template)) + "</span></td>" +
        '<td><div class="time-pair"><strong>' + escapeHTML(template.updatedAt) + "</strong><span>创建于 " + escapeHTML(template.createdAt) + "</span></div></td>" +
        '<td><div class="row-actions">' +
          '<a class="text-button muted" href="template-detail.html?id=' + encodeURIComponent(template.id) + '">查看详情</a>' +
          '<button class="text-button" type="button" data-action="reinfer" data-id="' + escapeHTML(template.id) + '"' + (locked ? " disabled" : "") + ">" + (template.pendingResult ? "待确认" : locked ? "反推中" : "重新反推") + "</button>" +
          '<button class="text-button ' + publishAction.className + '" type="button" data-action="' + publishAction.action + '" data-id="' + escapeHTML(template.id) + '">' + publishAction.label + "</button>" +
        "</div></td>" +
      "</tr>";
    }).join("");
  }

  function renderListState(state) {
    const tableRegion = document.getElementById("table-region");
    const stateLayer = document.getElementById("list-state");
    if (!tableRegion || !stateLayer) {
      return;
    }

    tableRegion.hidden = true;
    stateLayer.hidden = false;

    const states = {
      empty: '<div class="state-card"><span class="state-glyph">＋</span><h3>还没有模板</h3><p>上传第一张模板参考图，完成反推确认后即可发布给用户。</p><button class="button button-primary" type="button" data-open-upload>上传模板</button></div>',
      loading: '<div class="state-card"><span class="state-glyph">·</span><h3>正在加载模板</h3><div class="loading-lines" aria-label="加载中"><i></i><i></i><i></i></div></div>',
      error: '<div class="state-card"><span class="state-glyph">!</span><h3>模板列表加载失败</h3><p>暂时无法取得模板数据，请稍后重试。</p><button class="button button-outline" type="button" data-demo-state="normal">重新加载</button></div>',
      forbidden: '<div class="state-card"><span class="state-glyph">×</span><h3>无权访问模板管理</h3><p>该模块仅向内部运营人员开放。</p></div>'
    };

    stateLayer.innerHTML = states[state] || states.error;
  }

  function renderDetail(forceEditors) {
    const content = document.getElementById("detail-content");
    const stateLayer = document.getElementById("detail-state");
    if (!content || !stateLayer) {
      return;
    }

    if (demoState !== "normal") {
      renderDetailState(demoState);
      return;
    }

    const template = findTemplate(detailTemplateId);
    if (!template) {
      renderDetailState("not-found");
      return;
    }

    content.hidden = false;
    stateLayer.hidden = true;
    const publication = publishMeta(template.publishStatus);
    const inference = inferenceMeta(template);
    const publishAction = publicationAction(template);

    document.title = template.name + "｜模板详情｜营点AI运营工作台";
    setText("detail-name", template.name);
    setText("detail-id", template.id);
    setText("detail-material", template.material);
    setText("detail-created", template.createdAt);
    setText("detail-updated", template.updatedAt);
    setText("detail-inference-status", inference.label);
    setText("dimension-revision", "修订号：" + formatRevision(template));
    setText("dimension-revision-time", "最新修订时间：" + (template.revisionUpdatedAt || "尚未生成"));

    const publishBadge = document.getElementById("detail-publish-status");
    publishBadge.className = "status-badge " + publication.className;
    publishBadge.textContent = publication.label;

    const taskBanner = document.getElementById("task-banner");
    taskBanner.className = "task-banner" + (template.pendingResult ? " awaiting-review" : template.inferenceStatus === "failed" ? " failed" : "");
    setText("task-description", taskDescription(template));

    const reviewButton = document.getElementById("task-review-action");
    reviewButton.hidden = !template.pendingResult;

    const reinferButton = document.getElementById("detail-reinfer");
    reinferButton.disabled = isInferenceLocked(template);
    reinferButton.textContent = template.pendingResult ? "结果待确认" : isInferenceLocked(template) ? "反推处理中" : "重新反推";

    const publishButton = document.getElementById("detail-publish-action");
    publishButton.dataset.action = publishAction.action;
    publishButton.textContent = publishAction.label + "模板";
    publishButton.className = publishAction.action === "disable" ? "button button-danger-quiet" : "button button-primary";

    const poster = document.getElementById("detail-poster");
    poster.style.backgroundImage = 'url("' + template.image + '")';
    poster.innerHTML = '<div class="poster-copy"><small>' + escapeHTML(template.material.toUpperCase()) + "</small><strong>" + escapeHTML(template.name) + "</strong></div>";

    const usageEditor = document.getElementById("usage-editor");
    const markdownEditor = document.getElementById("markdown-editor");
    const shouldRefreshUsage = forceEditors || document.activeElement !== usageEditor && !isUsageDirty();
    const shouldRefreshMarkdown = forceEditors || document.activeElement !== markdownEditor && !isMarkdownDirty();

    if (shouldRefreshUsage) {
      usageEditor.value = template.usage || "";
      initialUsage = usageEditor.value;
    }
    if (shouldRefreshMarkdown) {
      markdownEditor.value = template.markdown || "";
      initialMarkdown = markdownEditor.value;
    }
    updateDirtyIndicators();
  }

  function renderDetailState(state) {
    const content = document.getElementById("detail-content");
    const stateLayer = document.getElementById("detail-state");
    if (!content || !stateLayer) {
      return;
    }

    content.hidden = true;
    stateLayer.hidden = false;
    const states = {
      loading: '<div class="state-card"><span class="state-glyph">·</span><h3>正在加载模板详情</h3><div class="loading-lines" aria-label="加载中"><i></i><i></i><i></i></div></div>',
      error: '<div class="state-card"><span class="state-glyph">!</span><h3>模板详情加载失败</h3><p>暂时无法取得模板内容，请稍后重试。</p><button class="button button-outline" type="button" data-demo-state="normal">重新加载</button></div>',
      forbidden: '<div class="state-card"><span class="state-glyph">×</span><h3>无权查看模板详情</h3><p>该模块仅向内部运营人员开放。</p><a class="button button-outline" href="index.html">返回模板列表</a></div>',
      "not-found": '<div class="state-card"><span class="state-glyph">?</span><h3>没有找到该模板</h3><p>模板可能不存在，或演示数据已经被重置。</p><a class="button button-primary" href="index.html">返回模板列表</a></div>'
    };
    stateLayer.innerHTML = states[state] || states.error;
  }

  function taskDescription(template) {
    if (template.pendingResult) {
      return "反推完成，新的模板信息等待确认。";
    }
    if (template.inferenceStatus === "pending") {
      return "反推任务已创建，等待处理。";
    }
    if (template.inferenceStatus === "processing") {
      return "正在反推模板信息，当前内容仍可使用。";
    }
    if (template.inferenceStatus === "failed") {
      return "本次反推未完成，当前内容和发布状态未发生变化。";
    }
    return "最近一次反推已经完成，当前没有待确认结果。";
  }

  function setText(elementId, value) {
    const element = document.getElementById(elementId);
    if (element) {
      element.textContent = value == null ? "" : String(value);
    }
  }

  function showToast(message) {
    const toast = document.getElementById("toast");
    if (!toast) {
      return;
    }
    window.clearTimeout(toastTimer);
    toast.textContent = message;
    toast.classList.add("show");
    toastTimer = window.setTimeout(function () {
      toast.classList.remove("show");
    }, 2600);
  }

  function openModal(elementId) {
    const modal = document.getElementById(elementId);
    if (!modal) {
      return;
    }
    modal.hidden = false;
    document.body.classList.add("modal-open");
  }

  function closeModal(elementId) {
    const modal = document.getElementById(elementId);
    if (!modal) {
      return;
    }
    modal.hidden = true;
    const openModalExists = Array.from(document.querySelectorAll(".modal-layer")).some(function (candidate) {
      return !candidate.hidden;
    });
    if (!openModalExists) {
      document.body.classList.remove("modal-open");
    }
  }

  function openConfirm(options) {
    setText("confirm-title", options.title || "确认操作");
    setText("confirm-message", options.message || "确认继续当前操作吗？");
    const actionButton = document.getElementById("confirm-action");
    actionButton.textContent = options.confirmLabel || "确认";
    actionButton.className = options.danger ? "button button-danger-quiet" : "button button-primary";
    confirmCallback = options.onConfirm || null;
    openModal("confirm-modal");
  }

  function closeConfirm() {
    confirmCallback = null;
    closeModal("confirm-modal");
  }

  function handleConfirmedAction() {
    const callback = confirmCallback;
    closeConfirm();
    if (typeof callback === "function") {
      callback();
    }
  }

  function openResult(templateId) {
    const template = findTemplate(templateId);
    if (!template || !template.pendingResult) {
      showToast("当前没有待确认的反推结果");
      renderCurrentPage(false);
      return;
    }

    activeResultId = templateId;
    setText("result-template-name", template.name);
    setText("result-current-revision", "当前信息维度修订号：" + formatRevision(template));
    setText("candidate-usage", template.pendingResult.usage || "未生成模板使用说明");
    setText("candidate-markdown", template.pendingResult.markdown || "未生成模板信息维度");
    openModal("result-modal");
  }

  function closeResult() {
    activeResultId = null;
    closeModal("result-modal");
  }

  function applyResult() {
    const template = findTemplate(activeResultId);
    if (!template || !template.pendingResult) {
      closeResult();
      showToast("待确认结果已失效");
      return;
    }

    if (pageType === "detail" && (isUsageDirty() || isMarkdownDirty())) {
      showToast("请先保存当前修改，再确认覆盖反推结果");
      return;
    }

    template.usage = template.pendingResult.usage || "";
    template.markdown = template.pendingResult.markdown || "";
    template.pendingResult = null;
    template.pendingKind = null;
    template.revision = Number(template.revision || 0) + 1;
    template.revisionUpdatedAt = formatNow();
    template.updatedAt = template.revisionUpdatedAt;
    persistTemplates();
    closeResult();
    renderCurrentPage(true);
  }

  function discardResult() {
    const template = findTemplate(activeResultId);
    if (!template || !template.pendingResult) {
      closeResult();
      showToast("待确认结果已失效");
      return;
    }

    const resultTemplateId = template.id;
    closeResult();
    openConfirm({
      title: "丢弃本次反推结果？",
      message: "候选模板信息维度和模板使用说明会被直接丢弃，当前内容保持不变。",
      confirmLabel: "丢弃结果",
      danger: true,
      onConfirm: function () {
        const currentTemplate = findTemplate(resultTemplateId);
        if (!currentTemplate) {
          return;
        }
        currentTemplate.pendingResult = null;
        currentTemplate.pendingKind = null;
        currentTemplate.updatedAt = formatNow();
        persistTemplates();
        renderCurrentPage(true);
      }
    });
  }

  function buildCandidate(template) {
    const materialNotes = {
      "朋友圈海报": "适合朋友圈传播，建议使用一张主体明确的酒店图片，并提供一句清晰的宣传主题。",
      "电子活动海报": "适合酒店活动推广，建议准备与活动直接相关的主图、活动主题和必要信息。",
      "邀请函": "适合晚宴、会员活动或节日邀请，建议准备具有氛围感的场景图和清晰的邀请主题。"
    };
    const usage = materialNotes[template.material] || "请准备一张主体明确的模板主图，并提供简短、清晰的制作主题。";
    const markdown = "# " + template.name + "\n\n" +
      "## 模板定位\n" +
      "- 物料类型：" + template.material + "\n" +
      "- 核心目标：从参考图提取可复用的信息与视觉关系\n\n" +
      "## 内容角色\n" +
      "- 主标题：核心宣传主题\n" +
      "- 辅助信息：必要的活动或产品说明\n" +
      "- 主图：与主题直接相关的酒店图片\n\n" +
      "## 视觉关系\n" +
      "- 主图承担主要氛围\n" +
      "- 标题保持清晰识别\n" +
      "- 辅助信息不遮挡图片主体\n\n" +
      "## 输出要求\n" +
      "- 保持完整的" + template.material + "构图\n" +
      "- 文字、图片与装饰关系清晰";
    return { usage: usage, markdown: markdown };
  }

  function startInference(templateId, kind) {
    const template = findTemplate(templateId);
    if (!template) {
      return;
    }
    const isFreshInitialTask = kind === "initial" && template.inferenceStatus === "pending" && template.pendingKind === "initial";
    if (isInferenceLocked(template) && !template.pendingResult && !isFreshInitialTask) {
      showToast("当前反推任务尚未结束");
      return;
    }

    template.inferenceStatus = "pending";
    template.pendingResult = null;
    template.pendingKind = kind;
    template.updatedAt = formatNow();
    persistTemplates();
    renderCurrentPage(false);
    showToast(kind === "initial" ? "模板已创建，首次反推待处理" : "重新反推任务已创建");

    window.setTimeout(function () {
      const currentTemplate = findTemplate(templateId);
      if (!currentTemplate || currentTemplate.inferenceStatus !== "pending") {
        return;
      }
      currentTemplate.inferenceStatus = "processing";
      currentTemplate.updatedAt = formatNow();
      persistTemplates();
      renderCurrentPage(false);
    }, 850);

    window.setTimeout(function () {
      const currentTemplate = findTemplate(templateId);
      if (!currentTemplate || currentTemplate.inferenceStatus !== "processing") {
        return;
      }
      currentTemplate.inferenceStatus = "success";
      currentTemplate.pendingResult = buildCandidate(currentTemplate);
      currentTemplate.updatedAt = formatNow();
      persistTemplates();
      renderCurrentPage(false);
      showToast("反推完成，等待运营人员确认结果");
    }, 2600);
  }

  function requestReinference(templateId) {
    const template = findTemplate(templateId);
    if (!template) {
      return;
    }
    if (isInferenceLocked(template)) {
      showToast(template.pendingResult ? "请先处理待确认的反推结果" : "反推处理中，暂不能再次发起");
      return;
    }
    openConfirm({
      title: "重新反推这个模板？",
      message: "系统会创建新的反推任务。完成后需要再次确认，确认前当前内容和发布状态保持不变。",
      confirmLabel: "开始反推",
      onConfirm: function () {
        startInference(templateId, "reinference");
      }
    });
  }

  function publicationMissingFields(template) {
    const missing = [];
    if (!String(template.name || "").trim()) {
      missing.push("模板名称");
    }
    if (!String(template.material || "").trim()) {
      missing.push("物料类型");
    }
    if (!String(template.image || "").trim()) {
      missing.push("模板原始参考图");
    }
    if (!String(template.markdown || "").trim()) {
      missing.push("模板信息维度");
    }
    return missing;
  }

  function requestPublicationAction(templateId, action) {
    const template = findTemplate(templateId);
    if (!template) {
      return;
    }

    if (action === "disable") {
      openConfirm({
        title: "停用这个模板？",
        message: "停用后不再向新用户展示，已有模板创作项目不受影响。",
        confirmLabel: "确认停用",
        danger: true,
        onConfirm: function () {
          changePublishStatus(templateId, "disabled", "模板已停用");
        }
      });
      return;
    }

    const missing = publicationMissingFields(template);
    if (missing.length > 0) {
      showToast("暂不能发布：缺少" + missing.join("、"));
      return;
    }

    openConfirm({
      title: action === "republish" ? "重新发布这个模板？" : "发布这个模板？",
      message: "发布后，用户可以在模板创作入口选择该模板。模板使用说明不是发布必填项。",
      confirmLabel: action === "republish" ? "重新发布" : "确认发布",
      onConfirm: function () {
        changePublishStatus(templateId, "published", action === "republish" ? "模板已重新发布" : "模板已发布");
      }
    });
  }

  function changePublishStatus(templateId, status, message) {
    const template = findTemplate(templateId);
    if (!template) {
      return;
    }
    template.publishStatus = status;
    template.updatedAt = formatNow();
    persistTemplates();
    renderCurrentPage(false);
    showToast(message);
  }

  function setupUploadModal() {
    if (pageType !== "list") {
      return;
    }

    const form = document.getElementById("upload-form");
    const imageInput = document.getElementById("template-image-input");
    const dropzone = document.getElementById("upload-dropzone");
    if (!form || !imageInput || !dropzone) {
      return;
    }

    imageInput.addEventListener("change", function () {
      const file = imageInput.files && imageInput.files[0];
      if (file) {
        prepareImage(file);
      }
    });

    dropzone.addEventListener("dragover", function (event) {
      event.preventDefault();
      dropzone.classList.add("dragover");
    });

    dropzone.addEventListener("dragleave", function () {
      dropzone.classList.remove("dragover");
    });

    dropzone.addEventListener("drop", function (event) {
      event.preventDefault();
      dropzone.classList.remove("dragover");
      const file = event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0];
      if (file && file.type.startsWith("image/")) {
        prepareImage(file);
      } else {
        setFieldError("templateImage", "请选择图片文件");
      }
    });

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      submitUploadForm();
    });

    form.addEventListener("input", function (event) {
      if (event.target.name) {
        setFieldError(event.target.name, "");
      }
    });
  }

  function prepareImage(file) {
    selectedUploadFileName = file.name;
    resizeImage(file).then(function (dataUrl) {
      selectedUploadImage = dataUrl;
      const preview = document.getElementById("upload-preview");
      const placeholder = document.getElementById("upload-placeholder");
      const replace = document.getElementById("replace-image");
      preview.src = dataUrl;
      preview.hidden = false;
      placeholder.hidden = true;
      replace.hidden = false;
      setFieldError("templateImage", "");
    }).catch(function () {
      setFieldError("templateImage", "图片读取失败，请重新选择");
    });
  }

  function resizeImage(file) {
    return new Promise(function (resolve, reject) {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = function () {
        const image = new Image();
        image.onerror = reject;
        image.onload = function () {
          const maxSide = 1000;
          const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
          const canvas = document.createElement("canvas");
          canvas.width = Math.max(1, Math.round(image.width * scale));
          canvas.height = Math.max(1, Math.round(image.height * scale));
          const context = canvas.getContext("2d");
          context.drawImage(image, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL("image/jpeg", 0.82));
        };
        image.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  function submitUploadForm() {
    const nameInput = document.getElementById("template-name-input");
    const materialInput = document.getElementById("material-type-input");
    const submitButton = document.getElementById("upload-submit");
    const name = nameInput.value.trim();
    const material = materialInput.value;
    let valid = true;

    setFieldError("templateName", "");
    setFieldError("materialType", "");
    setFieldError("templateImage", "");

    if (!name) {
      setFieldError("templateName", "请输入模板名称");
      valid = false;
    }
    if (!material) {
      setFieldError("materialType", "请选择物料类型");
      valid = false;
    }
    if (!selectedUploadImage) {
      setFieldError("templateImage", "请上传模板原始参考图");
      valid = false;
    }
    if (!valid) {
      showToast("请补充必填信息");
      return;
    }

    submitButton.disabled = true;
    submitButton.textContent = "正在上传…";
    window.setTimeout(function () {
      const timestamp = Date.now();
      const template = {
        id: "YD-TPL-" + String(timestamp).slice(-6),
        name: name,
        material: material,
        image: selectedUploadImage,
        imageName: selectedUploadFileName,
        publishStatus: "unpublished",
        inferenceStatus: "pending",
        revision: 0,
        revisionUpdatedAt: "",
        createdAt: formatNow(),
        updatedAt: formatNow(),
        usage: "",
        markdown: "",
        pendingResult: null,
        pendingKind: "initial"
      };
      loadTemplates().unshift(template);
      persistTemplates();
      closeUploadModal();
      renderList();
      startInference(template.id, "initial");
      submitButton.disabled = false;
      submitButton.textContent = "上传并开始反推";
    }, 560);
  }

  function setFieldError(fieldName, message) {
    const element = document.querySelector('[data-error-for="' + fieldName + '"]');
    if (element) {
      element.textContent = message;
    }
  }

  function openUploadModal() {
    const nameInput = document.getElementById("template-name-input");
    openModal("upload-modal");
    window.setTimeout(function () {
      if (nameInput) {
        nameInput.focus();
      }
    }, 20);
  }

  function closeUploadModal() {
    closeModal("upload-modal");
    const form = document.getElementById("upload-form");
    if (form) {
      form.reset();
    }
    selectedUploadImage = "";
    selectedUploadFileName = "";
    const preview = document.getElementById("upload-preview");
    const placeholder = document.getElementById("upload-placeholder");
    const replace = document.getElementById("replace-image");
    if (preview) {
      preview.hidden = true;
      preview.removeAttribute("src");
    }
    if (placeholder) {
      placeholder.hidden = false;
    }
    if (replace) {
      replace.hidden = true;
    }
    ["templateName", "materialType", "templateImage"].forEach(function (fieldName) {
      setFieldError(fieldName, "");
    });
  }

  function setupDetailPage() {
    if (pageType !== "detail") {
      return;
    }

    const query = new URLSearchParams(window.location.search);
    const firstTemplate = loadTemplates()[0];
    detailTemplateId = query.get("id") || (firstTemplate ? firstTemplate.id : "");
    renderDetail(true);

    const usageEditor = document.getElementById("usage-editor");
    const markdownEditor = document.getElementById("markdown-editor");
    usageEditor.addEventListener("input", updateDirtyIndicators);
    markdownEditor.addEventListener("input", updateDirtyIndicators);

    document.getElementById("save-usage").addEventListener("click", saveUsage);
    document.getElementById("save-markdown").addEventListener("click", saveMarkdown);
    document.getElementById("task-review-action").addEventListener("click", function () {
      openResult(detailTemplateId);
    });
    document.getElementById("detail-reinfer").addEventListener("click", function () {
      requestReinference(detailTemplateId);
    });
    document.getElementById("detail-publish-action").addEventListener("click", function (event) {
      requestPublicationAction(detailTemplateId, event.currentTarget.dataset.action);
    });
    document.getElementById("detail-back").addEventListener("click", function (event) {
      if (!isUsageDirty() && !isMarkdownDirty()) {
        return;
      }
      event.preventDefault();
      openConfirm({
        title: "离开模板详情？",
        message: "尚未保存的修改会丢失。",
        confirmLabel: "放弃修改并返回",
        danger: true,
        onConfirm: function () {
          allowNavigation = true;
          window.location.href = "index.html";
        }
      });
    });

    window.addEventListener("beforeunload", function (event) {
      if (allowNavigation || !isUsageDirty() && !isMarkdownDirty()) {
        return;
      }
      event.preventDefault();
      event.returnValue = "";
    });
  }

  function isUsageDirty() {
    const editor = document.getElementById("usage-editor");
    return Boolean(editor && editor.value !== initialUsage);
  }

  function isMarkdownDirty() {
    const editor = document.getElementById("markdown-editor");
    return Boolean(editor && editor.value !== initialMarkdown);
  }

  function updateDirtyIndicators() {
    const usageState = document.getElementById("usage-save-state");
    const markdownState = document.getElementById("markdown-save-state");
    if (usageState) {
      usageState.textContent = isUsageDirty() ? "有未保存修改" : "已保存";
      usageState.classList.toggle("dirty", isUsageDirty());
    }
    if (markdownState) {
      markdownState.textContent = isMarkdownDirty() ? "有未保存修改" : "已保存";
      markdownState.classList.toggle("dirty", isMarkdownDirty());
    }
  }

  function saveUsage() {
    const template = findTemplate(detailTemplateId);
    const editor = document.getElementById("usage-editor");
    if (!template || !editor) {
      return;
    }
    template.usage = editor.value;
    template.updatedAt = formatNow();
    initialUsage = editor.value;
    persistTemplates();
    renderDetail(false);
    showToast("模板使用说明已保存，信息维度修订号未变化");
  }

  function saveMarkdown() {
    const template = findTemplate(detailTemplateId);
    const editor = document.getElementById("markdown-editor");
    if (!template || !editor) {
      return;
    }
    template.markdown = editor.value;
    template.revision = Number(template.revision || 0) + 1;
    template.revisionUpdatedAt = formatNow();
    template.updatedAt = template.revisionUpdatedAt;
    initialMarkdown = editor.value;
    persistTemplates();
    renderDetail(false);
    showToast("模板信息维度已保存，修订号已更新");
  }

  function setupGlobalEvents() {
    document.addEventListener("click", function (event) {
      const uploadTrigger = event.target.closest("[data-open-upload]");
      if (uploadTrigger) {
        openUploadModal();
        return;
      }

      if (event.target.closest("[data-close-upload]")) {
        closeUploadModal();
        return;
      }

      if (event.target.closest("[data-close-confirm]")) {
        closeConfirm();
        return;
      }

      if (event.target.closest("[data-close-result]")) {
        closeResult();
        return;
      }

      const demoStateTrigger = event.target.closest("[data-demo-state]");
      if (demoStateTrigger) {
        demoState = demoStateTrigger.dataset.demoState;
        renderCurrentPage(false);
        return;
      }

      if (event.target.closest("[data-reset-data]")) {
        resetTemplates();
        return;
      }

      const actionTrigger = event.target.closest("[data-action]");
      if (!actionTrigger || pageType !== "list") {
        return;
      }
      const templateId = actionTrigger.dataset.id;
      const action = actionTrigger.dataset.action;
      if (action === "view-result") {
        openResult(templateId);
      } else if (action === "reinfer") {
        requestReinference(templateId);
      } else if (action === "publish" || action === "disable" || action === "republish") {
        requestPublicationAction(templateId, action);
      }
    });

    const confirmButton = document.getElementById("confirm-action");
    if (confirmButton) {
      confirmButton.addEventListener("click", handleConfirmedAction);
    }
    const applyButton = document.getElementById("apply-result");
    if (applyButton) {
      applyButton.addEventListener("click", applyResult);
    }
    const discardButton = document.getElementById("discard-result");
    if (discardButton) {
      discardButton.addEventListener("click", discardResult);
    }

    document.addEventListener("keydown", function (event) {
      if (event.key !== "Escape") {
        return;
      }
      const resultModal = document.getElementById("result-modal");
      const confirmModal = document.getElementById("confirm-modal");
      const uploadModal = document.getElementById("upload-modal");
      if (resultModal && !resultModal.hidden) {
        closeResult();
      } else if (confirmModal && !confirmModal.hidden) {
        closeConfirm();
      } else if (uploadModal && !uploadModal.hidden) {
        closeUploadModal();
      }
    });
  }

  function setupDemoTools() {
    const toggle = document.getElementById("demo-toggle");
    const panel = document.getElementById("demo-panel");
    if (!toggle || !panel) {
      return;
    }
    toggle.addEventListener("click", function () {
      panel.hidden = !panel.hidden;
    });
  }

  function renderCurrentPage(forceEditors) {
    if (pageType === "list") {
      renderList();
    } else if (pageType === "detail") {
      renderDetail(Boolean(forceEditors));
    }
  }

  loadTemplates();
  setupGlobalEvents();
  setupDemoTools();
  setupUploadModal();
  if (pageType === "list") {
    renderList();
  }
  setupDetailPage();
})();
