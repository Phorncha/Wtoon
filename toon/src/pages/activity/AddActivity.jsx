import React, { useState, useRef, useEffect } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getDocs, setDoc, doc, collection } from 'firebase/firestore';
import { db, storage } from '../../firebase';
import { Link } from 'react-router-dom';
import Modal from 'react-modal'; // นำเข้า Modal โดยไม่ใช้ curly braces

Modal.setAppElement('#root');

function AddActivity() {
    const [selectedFile, setSelectedFile] = useState(null);
    const [fileId, setFileId] = useState('');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);


    const [modalIsOpen, setModalIsOpen] = useState(false); // State สำหรับเปิด/ปิด modal
    const [missingFields, setMissingFields] = useState([]); // เพิ่ม state สำหรับ missingFields
    const inputRef = useRef(null); // สร้าง ref สำหรับ input

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        setSelectedFile(file);
    };

    const handleUpload = async () => {
        const missingFields = [];

        if (!selectedFile) missingFields.push("Image");
        if (!fileId) missingFields.push("ID");
        if (!title) missingFields.push("Title");
        if (!description) missingFields.push("Description");
        if (!startDate) missingFields.push("Start Date");
        if (!endDate) missingFields.push("End Date");
        
   

        if (missingFields.length > 0) {
            setMissingFields(missingFields); // ตั้งค่า missingFields
            setModalIsOpen(true);
            return;
        }

        const storageRef = ref(storage, `img_activity/${title}`);

        try {
            const snapshot = await uploadBytes(storageRef, selectedFile);
            const imageUrl = await getDownloadURL(snapshot.ref);

            await setDoc(doc(db, 'activity', fileId), {
                id: fileId,
                title: title,
                description: description,
                startDate: startDate,
                endDate: endDate,
                imageUrl: imageUrl,
  
            });

            console.log('Data uploaded successfully. Document ID:', fileId);
            window.location.reload();
        } catch (error) {
            console.error('Error uploading data:', error);
        }
    };

    const fetchActivity = async () => {
        try {
            const querySnapshot = await getDocs(collection(db, 'activity'));
            const activityData = querySnapshot.docs.map((doc) => doc.data());
            setActivity(activityData);
        } catch (error) {
            console.error('Error fetching activity:', error);
        }
    };

    const [activity, setActivity] = useState([]); // Declare setActivity here

    useEffect(() => {
        fetchActivity();
    }, []);

    return (
        <div className="container center">
            <div className="row">
                <div className="double-column data1">
                    <div className="file-input-container" onClick={() => inputRef.current.click()}>
                        {selectedFile ? (
                            <img src={URL.createObjectURL(selectedFile)} alt="Selected" />
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
                        <input type="text" value={fileId} onChange={(e) => setFileId(e.target.value)} />
                    </div>
                    <div className="input-row">
                        <label htmlFor="title" className="label">Title</label>
                        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} />
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
                    <button onClick={handleUpload}>UPLOAD</button>
                    {/* ส่วนของ Modal */}
                    <Modal
                        isOpen={modalIsOpen}
                        onRequestClose={() => setModalIsOpen(false)}
                        contentLabel="Incomplete Data Alert"
                        className="custom-modal" // เพิ่มคลาสสำหรับปรับแต่งสไตล์ของ Modal
                        overlayClassName="custom-overlay" // เพิ่มคลาสสำหรับปรับแต่งสไตล์ของ overlay
                    >
                        <div className="modal-content">
                            <h2>Please fill in the following fields</h2>
                            <ul>
                                {missingFields.map((field, index) => (
                                    <li key={index}>{field}</li>
                                ))}
                            </ul>
                            <button onClick={() => setModalIsOpen(false)}>Close</button>
                        </div>
                    </Modal>
                </div>
            </div>
            <div className="divider"></div>
            <div className="row grid-container">
                <div className="grid-container">
                    {activity.map((activity, index) => (
                        <Link key={index} to={`/activity/${activity.id}`} className="grid-item">
                            <img src={activity.imageUrl} alt={activity.title} />
                            <p style={{ color: 'white' }}>{activity.title}</p>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default AddActivity
