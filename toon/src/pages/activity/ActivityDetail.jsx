import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import Modal from 'react-modal';
import { deleteObject, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../firebase'; 
import { doc, getDoc,  deleteDoc, setDoc } from 'firebase/firestore';


Modal.setAppElement('#root');

function ActivityDetail() {
  const { id } = useParams();
  const inputRef = useRef(null);

  const [activityData, setActivityData] = useState({});
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileId, setFileId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [modalIsOpen, setModalIsOpen] = useState(false);
 




  useEffect(() => {
    const fetchActivityData = async () => {
      try {
        const docRef = doc(db, 'activity', id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setActivityData(data);
          setFileId(data.id || '');
          setTitle(data.title || '');
          setDescription(data.description || '');
          setStartDate(data.startDate || '');
          setEndDate(data.endDate || '');
        } else {
          console.log('No such document!');
        }
      } catch (error) {
        console.error('Error fetching story data:', error);
      }
    };

    fetchActivityData();
  }, [id]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setSelectedFile(file);
  };

  
  const handleDelete = async () => {
    try {
      await deleteDoc(doc(db, 'activity', id));
      const storageRef = ref(storage, `img_activity/${activityData.title}`);
      await deleteObject(storageRef);
  
      console.log('activity deleted successfully.');
  
      // เปลี่ยน URL เพื่อนำผู้ใช้ไปยัง /add-activity
      window.location.href = '/add-activity';
    } catch (error) {
      console.error('Error deleting activity:', error);
    }
  };

 

  

  const handleSave = async () => {
    let updatedImageUrl = activityData.imageUrl; // เริ่มต้นให้เป็น imageUrl เดิม
  
    try {
      // ถ้ามีการเปลี่ยนชื่อ title
      if (title !== activityData.title) {
        // ลบรูปเดิมที่เกี่ยวข้องกับชื่อเดิมออกจาก Firebase storage
        const existingImageRef = ref(storage, `img_activity/${activityData.title}`);
        await deleteObject(existingImageRef);
  
        if (selectedFile) {
          // อัปโหลดรูปใหม่ไปยัง Firebase storage
          const newImageRef = ref(storage, `img_activity/${title}`);
          const snapshot = await uploadBytes(newImageRef, selectedFile);
          updatedImageUrl = await getDownloadURL(snapshot.ref);
        }
      } else if (selectedFile) {
        // กรณีไม่มีการเปลี่ยนชื่อเรื่อง แต่มีการเลือกรูปใหม่
        const newImageRef = ref(storage, `img_activity/${title}`);
        const snapshot = await uploadBytes(newImageRef, selectedFile);
        updatedImageUrl = await getDownloadURL(snapshot.ref);
      }
  
      const updatedData = {
        id: fileId,
        title: title,
        description: description,
        startDate: startDate,
        endDate: endDate,
        imageUrl: updatedImageUrl
      };
  
      // อัปเดตข้อมูลเอกสารด้วยข้อมูลใหม่
      await setDoc(doc(db, 'activity', id), updatedData);
      console.log('activity updated successfully.');
      // รีเฟรชหน้าเว็บหลังจากการบันทึกข้อมูลเสร็จสิ้น
      window.location.reload();
      // ให้เปลี่ยนเส้นทางหรืออัปเดต UI ตามที่เหมาะสม
    } catch (error) {
      console.error('Error updating activity:', error);
    }
  };
  
  
  return (

    <div className="container center">
      {activityData && Object.keys(activityData).length > 0 ? (
        <div className="row">
          <div className="double-column data1">
            <div className="file-input-container" onClick={() => inputRef.current.click()}>
              {selectedFile || activityData.imageUrl ? (
                <img src={selectedFile ? URL.createObjectURL(selectedFile) : activityData.imageUrl} alt="Image Missing" />
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
              <input type="text" value={fileId || id} readOnly onChange={(e) => setFileId(e.target.value)} />
            </div>
            <div className="input-row">
              <label htmlFor="title" className="label">Title</label>
              <input type="text" value={title || title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="input-row">
              <label htmlFor="description" className="label">Description</label>
              <textarea id="description" rows="3" value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div className="input-row">
              <label>Start Date:</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              <label>End Date:</label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
            {/* บันทึกการแก้ไข */}
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
                <p>Are you sure you want to delete this activity?</p>
                <div className="input-row">
                  <button className="delete-button" onClick={handleDelete}>Delete</button>
                  <button className="save-button" onClick={() => setModalIsOpen(false)}>Cancel</button>
                </div>
              </div>
            </Modal>
          </div>
        </div>
      ) : (
        <h2>...Loading activity data...</h2>
      )}
      <div className="divider"></div>

      
    </div>

  );
}

export default ActivityDetail
