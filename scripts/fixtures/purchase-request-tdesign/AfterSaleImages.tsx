import { useEffect, useId, useState } from 'react';
import { Button, Image, Popup } from 'tdesign-react';
import { AddIcon, BrowseIcon, CloudUploadIcon, DeleteIcon } from 'tdesign-icons-react';
import damagedProductImage from './assets/after-sale-product-example.png';
import damagedPackageImage from './assets/after-sale-package-example.png';
import './FileTransferActions.css';

const imageExamples = [
  { name: '商品破损示例.png', url: damagedProductImage },
  { name: '外包装示例.png', url: damagedPackageImage },
];

export function AfterSaleImages({ readOnly = false, label = '图片凭证' }: { readOnly?: boolean; label?: string }) {
  const fieldId = useId(), addId = `${fieldId}-add`;
  const [draggingImage, setDraggingImage] = useState(false);
  const [images, setImages] = useState(() => readOnly ? imageExamples : []);
  const [previewImage, setPreviewImage] = useState('');
  useEffect(() => {
    if (!previewImage) return;
    // Close the image before TDesign's document-level Escape handler closes its form or drawer.
    const closePreview = (event: KeyboardEvent) => { if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); setPreviewImage(''); } };
    window.addEventListener('keydown', closePreview, true);
    return () => window.removeEventListener('keydown', closePreview, true);
  }, [previewImage]);
  const previewImageUpload = () => { setDraggingImage(false); setImages(imageExamples); };
  return <section className="after-sale-image-upload shipping-text-field" aria-labelledby={`${fieldId}-label`}>
    <div className="after-sale-image-heading">
      {readOnly ? <h3 id={`${fieldId}-label`}>{label}</h3> : <span id={`${fieldId}-label`}>{label}<span className="secondary">（选填）</span></span>}
      <span className="secondary" role="status">{images.length ? `${readOnly ? '' : '已添加 '}${images.length} 张 · 示例图片` : ''}</span>
    </div>
    <div className={images.length ? 'after-sale-image-gallery' : undefined}>
      {images.map(image => <div className="after-sale-image-card" key={image.name}>
        <Image src={image.url} alt={image.name} fit="cover" className="after-sale-image-thumbnail" />
        <span className="after-sale-image-name" title={image.name}>{image.name}</span>
        <div className="after-sale-image-actions">
          <Popup trigger="click" placement="top-left" visible={previewImage === image.name} onVisibleChange={visible => setPreviewImage(visible ? image.name : '')} content={<Image src={image.url} alt={`${image.name}大图预览`} fit="contain" style={{ width: 'min(360px, calc(100vw - 64px))', height: 'min(360px, calc(100vw - 64px))' }} />}>
            <Button type="button" size="small" variant="text" theme="primary" icon={<BrowseIcon />} aria-label={`预览${image.name}`} aria-expanded={previewImage === image.name}>预览</Button>
          </Popup>
          {!readOnly && <Button type="button" size="small" variant="text" shape="square" icon={<DeleteIcon />} aria-label={`移除${image.name}`} onClick={() => { setPreviewImage(''); setImages(images.filter(item => item.name !== image.name)); requestAnimationFrame(() => document.getElementById(addId)?.focus()); }} />}
        </div>
      </div>)}
      {!readOnly && <Button id={addId} type="button" variant="outline" className={`import-dropzone${images.length ? ' after-sale-image-add' : ''}${draggingImage ? ' is-dragging' : ''}`} aria-label="上传售后图片（样式预览）" aria-describedby={`${fieldId}-hint`} onClick={previewImageUpload}
        onDragEnter={event => { event.preventDefault(); setDraggingImage(true); }}
        onDragOver={event => event.preventDefault()}
        onDragLeave={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDraggingImage(false); }}
        onDrop={event => { event.preventDefault(); previewImageUpload(); }}>
        {images.length ? <AddIcon className="import-dropzone-icon" /> : <CloudUploadIcon className="import-dropzone-icon" />}
        <span className="import-dropzone-title">{draggingImage ? '松开鼠标放入图片' : images.length ? '继续添加' : <>将图片拖到此处，或<span className="import-dropzone-link">点击上传</span></>}</span>
        <span className="import-dropzone-hint">{images.length ? '也可拖拽图片' : '商品照片、包装照片或沟通截图'}</span>
      </Button>}
    </div>
    <span id={`${fieldId}-hint`} className="secondary">{readOnly ? '内置示例图，仅用于展示上传后样式。' : '样式预览：点击或拖放展示内置示例图，不读取、上传或保存文件。'}</span>
  </section>;
}
