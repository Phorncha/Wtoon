import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc, deleteDoc, setDoc, collection, getDocs } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import Modal from 'react-modal';
import { db, storage } from '../firebase';

Modal.setAppElement('#root');

function StoryDetail() {
  const { id } = useParams();
  const inputRef = useRef(null);

  const [storyData, setStoryData] = useState({});
  const [gridData, setGridData] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [fileId, setFileId] = useState('');
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [day, setDay] = useState('');
  const [description, setDescription] = useState('');
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [addModalIsOpen, setAddModalIsOpen] = useState(false);
  const [categories, setCategories] = useState([]);

  const [ep, setEp] = useState('');

  useEffect(() => {
    const fetchStoryData = async () => {
      try {
        const docRef = doc(db, 'storys', id);
        const docSnap = await getDoc(docRef);
  
        if (docSnap.exists()) {
          const data = docSnap.data();
          setStoryData(data);
          setCategories(data.categories || []);
          setFileId(data.id || '');
          setTitle(data.title || '');
          setAuthor(data.author || '');
          setDay(data.day || '');
          setDescription(data.description || '');
        } else {
          console.log('No such document!');
        }
  
        // ดึงข้อมูลจาก collection storys_ep
        const epCollectionRef = collection(db, id);
        const epCollectionSnapshot = await getDocs(epCollectionRef);
        const epCollectionData = epCollectionSnapshot.docs.map(doc => doc.data());
  
        // อัปเดต state ของ gridData เพื่อแสดงข้อมูลใน grid-container
        setGridData(epCollectionData);
      } catch (error) {
        console.error('Error fetching story data:', error);
      }
    };
  
    fetchStoryData();
  }, [id]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setSelectedFile(file);
  };

  function handleFileChanges(event) {
    const files = event.target.files;
    const filesArray = Array.from(files);
    setSelectedFiles(filesArray);
  }

  const handleDelete = async () => {
    try {
      await deleteDoc(doc(db, 'storys', id));
      const storageRef = ref(storage, `img_storys/${storyData.title}`);
      await deleteObject(storageRef);
  
      console.log('Story deleted successfully.');
  
      // เปลี่ยน URL เพื่อนำผู้ใช้ไปยัง /add-story
      window.location.href = '/add-story';
    } catch (error) {
      console.error('Error deleting story:', error);
    }
  };
  

  const handleCategoryChange = (selectedCategory) => {
    if (categories.includes(selectedCategory)) {
      setCategories(categories.filter(category => category !== selectedCategory));
    } else {
      setCategories([...categories, selectedCategory]);
    }
  };
  
  const handleSave = async () => {
    let updatedImageUrl = storyData.imageUrl; // เริ่มต้นให้เป็น imageUrl เดิม
  
    try {
      // ถ้ามีการเปลี่ยนชื่อ title
      if (title !== storyData.title) {
        // ลบรูปเดิมที่เกี่ยวข้องกับชื่อเดิมออกจาก Firebase storage
        const existingImageRef = ref(storage, `img_storys/${storyData.title}`);
        await deleteObject(existingImageRef);
  
        if (selectedFile) {
          // อัปโหลดรูปใหม่ไปยัง Firebase storage
          const newImageRef = ref(storage, `img_storys/${title}`);
          const snapshot = await uploadBytes(newImageRef, selectedFile);
          updatedImageUrl = await getDownloadURL(snapshot.ref);
        }
      } else if (selectedFile) {
        // กรณีไม่มีการเปลี่ยนชื่อเรื่อง แต่มีการเลือกรูปใหม่
        const newImageRef = ref(storage, `img_storys/${title}`);
        const snapshot = await uploadBytes(newImageRef, selectedFile);
        updatedImageUrl = await getDownloadURL(snapshot.ref);
      }
  
      const updatedData = {
        id: fileId,
        title: title,
        author: author,
        day: day,
        description: description,
        categories: categories,
        imageUrl: updatedImageUrl
      };
  
      // อัปเดตข้อมูลเอกสารด้วยข้อมูลใหม่
      await setDoc(doc(db, 'storys', id), updatedData);
      console.log('Story updated successfully.');
      // รีเฟรชหน้าเว็บหลังจากการบันทึกข้อมูลเสร็จสิ้น
      window.location.reload();
      // ให้เปลี่ยนเส้นทางหรืออัปเดต UI ตามที่เหมาะสม
    } catch (error) {
      console.error('Error updating story:', error);
    }
  };

  const handleAddClick = (id) => {
    setAddModalIsOpen(true);
    setFileId(id);
  };
  
  const handleAddModalClose = () => {
    setAddModalIsOpen(false);
    setSelectedFiles([]);
    setFileId(''); // รีเซ็ตค่า fileId เมื่อปิด Modal
    setEp(''); // รีเซ็ตค่า fileId เมื่อปิด Modal
  };

  const handleAdd = async () => {
    try {
      // บันทึกรูปทั้งหมดที่เลือกไปเก็บใน storage
      const storagePromises = selectedFiles.map(async (file, index) => {
        const storageRef = ref(storage, `${title}/ep${ep}/${index + 1}`);
        await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(storageRef);
        return downloadURL;
      });
  
      const imageURLs = await Promise.all(storagePromises);
  
      // สร้างข้อมูลที่ต้องบันทึกใน Firebase Database
      const newData = {
        id: id,
        ep: ep,
        images: imageURLs,
      };
  
      // บันทึกข้อมูลลงใน Firebase Database
      await setDoc(doc(db, id, `${title} EP ${ep}`), newData);
  
      console.log('New EP added successfully.');
      handleAddModalClose(); // ปิด Modal เมื่อเสร็จสิ้น
    } catch (error) {
      console.error('Error adding new EP:', error);
    }
  };
  
  
  return (
    
    <div className="container center">
      {storyData && Object.keys(storyData).length > 0 ? (
        <div className="row">
          <div className="double-column data1">
          <div className="file-input-container" onClick={() => inputRef.current.click()}>
            {selectedFile || storyData.imageUrl ? (
              <img src={selectedFile ? URL.createObjectURL(selectedFile) : storyData.imageUrl} alt="Image Missing" />
            ) : (
              <p className="file-input-text">Click to select Image</p>
            )}
          </div>
          <input
            type="file"
            ref={inputRef}
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
          </div>
          <div className="double-column">
            <div className="input-row">
              <label htmlFor="fileId" className="label">ID</label>
              <input
                type="text"
                value={fileId || id} // ใช้ fileId ถ้ามีค่า ถ้าไม่ใช้ storyData.id จาก Firebase
                readOnly
                onChange={(e) => setFileId(e.target.value)}
              />
            </div>
            <div className="input-row">
              <label htmlFor="title" className="label">Title</label>
                <input
                  type="text"
                  value={title || title} // ใช้ title ถ้ามีค่า ถ้าไม่ใช้ storyData.title จาก Firebase
                  onChange={(e) => setTitle(e.target.value)}
                />
              <label htmlFor="author" className="label">Author</label>
              <input
                type="text"
                value={author || storyData.author}
                onChange={(e) => setAuthor(e.target.value)}
              />
            </div>
            <div className="input-row">
              <label htmlFor="dropdown" className="label">Day</label>
              <select
                id="dropdown"
                name="dropdown"
                className="custom-dropdown"
                value={day || storyData.day}
                onChange={(e) => setDay(e.target.value)}
              >
                <option value=""></option>
                <option value="sunday">Sunday</option>
                <option value="monday">Monday</option>
                <option value="tuesday">Tuesday</option>
                <option value="wednesday">Wednesday</option>
                <option value="thursday">Thursday</option>
                <option value="friday">Friday</option>
                <option value="saturday">Saturday</option>
              </select>
              <label className="label">Category</label>
              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={categories.includes("action")}
                  onChange={() => handleCategoryChange("action")}
                />{" "}
                Action
              </label>
              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={categories.includes("comedy")}
                  onChange={() => handleCategoryChange("comedy")}
                />{" "}
                Comedy
              </label>
              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={categories.includes("romance")}
                  onChange={() => handleCategoryChange("romance")}
                />{" "}
                Romance
              </label>
              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={categories.includes("fantasy")}
                  onChange={() => handleCategoryChange("fantasy")}
                />{" "}
                Fantasy
              </label>
              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={categories.includes("horror")}
                  onChange={() => handleCategoryChange("horror")}
                />{" "}
                Horror
              </label>
            {/* เพิ่ม category อื่น ๆ ตามที่คุณต้องการ */}
            </div>

            <div className="input-row">
              <label htmlFor="description" className="label">Description</label>
                <textarea
                  id="description"
                  rows="3"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
            </div>

            <div className="input-row">
              <button className="save-button" onClick={handleSave}>Save</button>
              <button className="delete-button" onClick={() => setModalIsOpen(true)}>Delete</button>
            </div>

            <Modal
              isOpen={modalIsOpen}
              onRequestClose={() => setModalIsOpen(false)}
              contentLabel="Delete Confirmation"
              className="custom-modal" // เพิ่มคลาสสำหรับปรับแต่งสไตล์ของ Modal
              overlayClassName="custom-overlay" // เพิ่มคลาสสำหรับปรับแต่งสไตล์ของ overlay
            >
              <div className="modal-content">
                <p>Are you sure you want to delete this story?</p>
                <div className="input-row">
                  <button className="delete-button" onClick={handleDelete}>Delete</button>
                  <button className="save-button" onClick={() => setModalIsOpen(false)}>Cancel</button>
                </div>
              </div>
            </Modal>
          </div>
        </div>
      ) : (
        <h2>...Loading story data...</h2>
      )}
        <div className="divider"></div>

        <div className="row grid-container">
          <div className="grid-container">
            <div className="grid-item-add" onClick={() => handleAddClick(id)}>
              <h2>+</h2>
            </div>
            {gridData.map((item, index) => (
              <div className="grid-item" key={index}>
                <p>{item.ep}</p>
                {/* แสดงข้อมูลในแต่ละ grid-item */}
              </div>
            ))}
          </div>
      </div>

      <Modal
        isOpen={addModalIsOpen}
        onRequestClose={handleAddModalClose}
        contentLabel="Add New EP"
        className="custom-modal" // เพิ่มคลาสสำหรับปรับแต่งสไตล์ของ Modal
        overlayClassName="custom-overlay" // เพิ่มคลาสสำหรับปรับแต่งสไตล์ของ overlay
      >
        <div className="modal-content">
          <h2>Add EP</h2>
          <div className="img-input-container" onClick={() => inputRef.current.click()}>
            {selectedFiles.length > 0 ? (
              <p className="file-input-text">{selectedFiles.length} Images selected</p>
            ) : (
              <p className="file-input-text">Click to select file Images</p>
            )}
          </div>
          <input
            type="file"
            ref={inputRef}
            style={{ display: 'none' }}
            onChange={handleFileChanges}
            multiple // เพิ่ม attribute multiple เพื่ออนุญาตให้เลือกรูปหลายรูปพร้อมกัน
          />
          <div className="input-row-model">
            <label htmlFor="">EP</label>
            <input
              type="text"
              value={ep}
              onChange={(e) => setEp(e.target.value)}
            />
          </div>
          <div className="input-row-model">
            <button className="add-button" onClick={handleAdd}>Add</button>
            <button className="cancel-button" onClick={handleAddModalClose}>Cancel</button>
          </div>
        </div>
      </Modal>

    </div>
    
  );
}

export default StoryDetail;
