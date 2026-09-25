// ============================================================
// 上传大小的前端预检（与后端 app/services/case_files.py 的 MAX_FILE_MB 一致）
//
// 案件文件、证据槽、供应链审查的上传不限格式，只限大小；超限的文件在前端直接拦下，
// 不必传完 50 MB 才收到 413。案件室任务与首次资料用 MultiFileUploader（后端下发限制，另有格式检查）。
// ============================================================
export const MAX_UPLOAD_MB = 50;

/** 不合格返回提示文字，合格返回空字符串 */
export function sizeError(file) {
  if (!file) return '';
  if (file.size === 0) return `「${file.name}」是空文件，请重新选择`;
  if (file.size > MAX_UPLOAD_MB * 1024 * 1024) return `「${file.name}」超过 ${MAX_UPLOAD_MB} MB，无法上传`;
  return '';
}
