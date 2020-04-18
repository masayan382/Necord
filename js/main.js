/************************** 共通********************************* */
// 現在ログインしているユーザID
let currentUID;

let currentyymm;

// Firebaseから取得したデータを一時保存しておくための変数
let dbdata = {};

//カレンダー用の★用データ
let recordData = [];

/************************** 初期表示 ********************************* */

const firstshow = (yymm) => {
	// console.log("firstshow開始");
	// console.log("yymm:" + yymm);
	if (yymm == 'first') {
		//当年月を求める
		console.log('初回につき年月日取得');
		var dt = new Date(); //現在日時のDateオブジェクトを生成
		// console.log(dt);
		var ldt = new Date(dt.getFullYear(), dt.getMonth() + 1, 0); //今月末日を取得
		// console.log(ldt);

		//フォーマット整形
		var y = ldt.getFullYear();
		var m = ('00' + (ldt.getMonth() + 1)).slice(-2);
		var d = ('00' + ldt.getDate()).slice(-2);
		var result = y + '/' + m + '/' + d;
		var yymm2 = y + m;

		//コンソールに出力
		// console.log('yymm2:' + yymm2);
		currentyymm = yymm2;
	} else {
		console.log('２回目以降');
		currentyymm = yymm;
	}
	console.log('2回目' + currentyymm);
	//
	const necordRef = firebase
		.database()
		.ref(`NecordFormData/${currentUID}/${currentyymm}`);
	// 過去に登録したイベントハンドラを削除
	necordRef.off('child_removed');
	necordRef.off('child_added');
	console.log('necordRef');

	buildCalender(); //データがない時のタイミング①カレンダー呼び出し
	console.log('カレンダー①');

	necordRef.on('child_added', (favSnapshot) => {
		const necordId = favSnapshot.key;
		const necordData = favSnapshot.val();
		if (!dbdata.formData) {
			// データを初期化する
			dbdata.formData = {};
		}
		dbdata.formData[necordId] = necordData;
		console.log('necordData' + necordData);
    console.log(necordData.timeLog);
		setRecordData(necordData);
		buildCalender(); //カレンダー呼び出し
		console.log('カレンダー②');
	});

	necordRef.on('child_removed', (favSnapshot) => {
		const necordId = favSnapshot.key;
		const necordData = favSnapshot.val();
		console.log('child_removed');
		if (!dbdata.formData) {
			// データを初期化する
			dbdata.formData = {};
		}
		dbdata.formData[necordId] = necordData;
		window.location.reload(false);
	});
};

const setRecordData = (necordData) => {
	recordData.push({
		title: '★',
		start: necordData.timeLog,
	});
};
// console.log('setRecordData' + setRecordData);

/************************** カレンダー ********************************* */
const buildCalender = function () {
	var calendarEl = document.getElementById('calendar');
	$(calendarEl).empty();
	const calendar = new FullCalendar.Calendar(calendarEl, {
		plugins: ['interaction', 'dayGrid'],
		defaultView: 'dayGridMonth',
		selectable: true,
		locale: 'ja',
		navLinks: true,
		eventTimeFormat: { hour: 'numeric', minute: '2-digit' },
		navLinkDayClick: function (date, jsEvent) {
			// console.log("day", date.toISOString());
		},
		dateClick: function (info) {
			// alert("clicked " + info.dateStr);
			// console.log(info);
			// var today = info.dateStar;
			// resetForm();
			var y = info.dateStr.slice(0, 4);
			var m = info.dateStr.slice(5, 7);
			var d = info.dateStr.slice(8, 10);

			if (dbdata.formData[d] === undefined) {
				showView('form-edit');
				$('#year').val(y);
				$('#month').val(m);
				$('#day').val(d);
			} else {
				closeView('modify-photo');
				showView('modify-form');
				$('#modify-year').val(y);
				$('#modify-month').val(m);
				$('#modify-day').val(d);
				//写真表示
				var oldPhotoImage = dbdata.formData[d].photoImageLocation;
				$('#oldphoto').show();
				firebase
					.storage()
					.ref(oldPhotoImage)
					.getDownloadURL()
					.then((url) => {
						// 画像URL取得成功
						$('#oldphoto').children('img').attr('src', url);
					})
					.catch((error) => {
						console.error('写真のダウンロードに失敗:', error);
					});
				// 写真削除
				$('#oldphoto-delet').on('click', (e) => {
					firebase
						.database()
						.ref(`NecordFormData/${currentUID}/${ylog}${mlog}/${dlog}/`)
						.remove()
						.then(() => {
							console.log('写真削除成功');
						})
						.catch((error) => {
							console.error('削除失敗:', error);
						});
				});
				// 元気度
				var oldEnergy = dbdata.formData[d].energyLevel;
				if (oldEnergy === '1') {
					$('#modify-energy > [value = "1"]').prop('selected', true);
				} else if (oldEnergy === '2') {
					$('#modify-energy > [value = "2"]').prop('selected', true);
				} else if (oldEnergy === '3') {
					$('#modify-energy > [value = "3"]').prop('selected', true);
				} else {
					$('#modify-energy > [value = "0"]').prop('selected', true);
				}
				// 食事転記
				var oldMealVolume = dbdata.formData[d].mealVolume;
				if (oldMealVolume === '0') {
					$('input[name="oldmeal"][value="0"]').prop('checked', true);
				}
				if (oldMealVolume === '1') {
					$('input[name="oldmeal"][value="1"]').prop('checked', true);
				}
				if (oldMealVolume === '2') {
					$('input[name="oldmeal"][value="2"]').prop('checked', true);
				}
				// 排泄転記
				var oldExcretionPresence = dbdata.formData[d].excretionPresence;
				if (oldExcretionPresence === '0') {
					$('input[name="oldexcretion"][value="0"]').prop('checked', true);
				} else {
					$('input[name="oldexcretion"][value="1"]').prop('checked', true);
				}
				// 体重表記
				var oldWeightLog = dbdata.formData[d].weightLog;
				var oldWeight = Number(oldWeightLog);
				$('#modify-weight').val(oldWeight);
			}
		},
		// eventClick: function(calEvent, jsEvent, view) {
		//   alert("Clicked on: " + "item.title");
		// },
		events: recordData,
	});
	calendar.render();
};

// 修正フォーム画像プレビュー
function imgPreView2(event) {
	var file = event.target.files[0];
	var reader2 = new FileReader();
	var preview2 = document.getElementById('preview2');
	var previewImage2 = document.getElementById('previewImage2');

	if (previewImage2 != null) {
		preview2.removeChild(previewImage2);
	}
	reader2.onload = function (event) {
		var img = document.createElement('img');
		img.setAttribute('src', reader2.result);
		img.setAttribute('id', 'previewImage2');
		img.setAttribute('width', '250px');
		preview2.appendChild(img);
	};
	reader2.readAsDataURL(file);
}
//写真を変更
$('#oldphoto-update').on('click', (e) => {
	$('#oldphoto').fadeOut();
	$('#modify-photo').fadeIn();
});
//修正ボタン
// $("form").submit(e => {
$('#modify-form_change').on('click', (e) => {
	e.preventDefault();
	console.log('修正form送信');

	// 日付
	const ylog = $('#modify-year').val();
	const mlog = $('#modify-month').val();
	const dlog = $('#modify-day').val();
	const timeLog = `${ylog}-${mlog}-${dlog}`;
	// 元気度
	const energyLevel = $('#modify-energy option:selected').val();
	console.log('el' + energyLevel);
	// 食事量
	const mealVolume = $("input[name='oldmeal']:checked").val();
	console.log('mv' + mealVolume);
	// 排泄有無
	const excretionPresence = $("input[name='oldexcretion']:checked").val();
	console.log('ep' + excretionPresence);
	// 体重
	var weightLog = $('#modify-weight').val();
	console.log('wL' + weightLog);
	//photo
	var $mphotoImage = $('#modify-photo');
	console.log('修写' + $mphotoImage);
	var { files } = $mphotoImage[0];
	if (files.length === 0) {
		return;
	}
	var file = files[0];
	var filename = file.name;
	console.log('fn:' + filename);
	var photoImageLocation = `photo-images/${filename}`;
	console.log('pI:' + photoImageLocation);
	// 画像を保存する
	// console.log("firebaseへ接続");
	firebase
		.storage()
		.ref(photoImageLocation)
		.put(file) // Storageへファイルアップロードを実行
		.then(() => {
			// Storageへのアップロードに成功したら、Realtime Databaseに画像データを保存する
			const photoData = {
				timeLog,
				energyLevel,
				mealVolume,
				excretionPresence,
				weightLog,
				photoImageLocation,
				createdAt: firebase.database.ServerValue.TIMESTAMP,
			};
			return firebase
				.database()
				.ref(`NecordFormData/${currentUID}/${ylog}${mlog}/${dlog}/`)
				.update(photoData);
		});
	$('form #modify-form').submit();
	console.log('update成功');
	resetForm();
	closeView('modify-form');
	showView('fullcalendar-edit');
});

// 修正中止
$('#modify-form_stop').on('click', (e) => {
	console.log('中止ボタン');
	resetForm();
	closeView('modify-form');
	showView('fullcalendar-edit');
});
// 中止ボタンの中止
$('#modify-confilm_stop').on('click', (e) => {
	console.log('中止の中止ボタン');
});
// 登録データの削除
$('#modify-confilm_delete').on('click', (e) => {
	console.log('データ削除開始');
	const ylog = $('#modify-year').val();
	const mlog = $('#modify-month').val();
	const dlog = $('#modify-day').val();

	firebase
		.database()
		.ref(`NecordFormData/${currentUID}/${ylog}${mlog}/${dlog}/`)
		.remove()
		.then(() => {
			console.log('データベースから削除成功');
		})
		.catch((error) => {
			console.error('削除失敗:', error);
		});

	resetForm();
	onLogin();
	// closeView("modify-form");
	// showView("fullcalendar-edit");
});

/************************** ここまで ********************************* */

// メニューのカレンダーから表示させる
$('#fullcalendar').on('click', (e) => {
	resetForm();
	showView('fullcalendar-edit');
});

const showView = (id) => {
	$('.view').hide();
	$(`#${id}`).fadeIn();
};

const closeView = (id) => {
	$('.view').show();
	$(`#${id}`).fadeOut();
};

// 今のネコの名前を表示
const catNameDisplayNow = () => {
	const catNameRef = firebase
		.database()
		.ref(`NecordAccount/${currentUID}/catName`);
	catNameRef.on('value', function (snapshot) {
		const catNameNow = snapshot.val();
		$('#cat-name-display').text(`${catNameNow}`);
	});
};

/************************** ログイン関係 ********************************* */

// ログインフォームを初期状態に戻す;
const resetLoginForm = () => {
	$('#login-form > .form-group').removeClass('has-error');
	$('#login__help').hide();
	$('#login__submit-button').prop('disabled', false).text('ログイン');
};

// ログインした直後に呼ばれる
const onLogin = () => {
	console.log('ログイン');
	catNameDisplayNow();
	firstshow('first');
	showView('fullcalendar-edit');
};

// ログアウトした直後に呼ばれる
const onLogout = () => {
	firebase.database().ref('NecordFormData').off('value');
	dbdata = {};
	resetLoginForm();
	showView('login');
};

// ユーザ作成のときパスワードが弱すぎる場合に呼ばれる
const onWeakPassword = () => {
	resetLoginForm();
	$('#login__password').addClass('has-error');
	$('#login__help').text('6文字以上のパスワードを入力してください').fadeIn();
};

// ログインのときパスワードが間違っている場合に呼ばれる
const onWrongPassword = () => {
	resetLoginForm();
	$('#login__password').addClass('has-error');
	$('#login__help').text('正しいパスワードを入力してください').fadeIn();
};

// ログインのとき試行回数が多すぎてブロックされている場合に呼ばれる
const onTooManyRequests = () => {
	resetLoginForm();
	$('#login__submit-button').prop('disabled', true);
	$('#login__help')
		.text('試行回数が多すぎます。後ほどお試しください。')
		.fadeIn();
};

// ログインのときメールアドレスの形式が正しくない場合に呼ばれる
const onInvalidEmail = () => {
	resetLoginForm();
	$('#login__email').addClass('has-error');
	$('#login__help').text('メールアドレスを正しく入力してください').fadeIn();
};

// その他のログインエラーの場合に呼ばれる
const onOtherLoginError = () => {
	resetLoginForm();
	$('#login__help').text('ログインに失敗しました').fadeIn();
};

/**
 * ---------------------------------------
 * 以下、コールバックやイベントハンドラの登録と、
 * ページ読み込みが完了したタイミングで行うDOM操作
 * ---------------------------------------
 */

// ユーザ作成に失敗したことをユーザに通知する
const catchErrorOnCreateUser = (error) => {
	// 作成失敗
	console.error('ユーザ作成に失敗:', error);
	if (error.code === 'auth/weak-password') {
		onWeakPassword();
	} else {
		// その他のエラー
		onOtherLoginError(error);
	}
};

// ログインに失敗したことをユーザーに通知する
const catchErrorOnSignIn = (error) => {
	if (error.code === 'auth/wrong-password') {
		// パスワードの間違い
		onWrongPassword();
	} else if (error.code === 'auth/too-many-requests') {
		// 試行回数多すぎてブロック中
		onTooManyRequests();
	} else if (error.code === 'auth/invalid-email') {
		// メールアドレスの形式がおかしい
		onInvalidEmail();
	} else {
		// その他のエラー
		onOtherLoginError(error);
	}
};

// ログイン状態の変化を監視する
firebase.auth().onAuthStateChanged((user) => {
	// ログイン状態が変化した

	if (user) {
		// ログイン済
		currentUID = user.uid;
		onLogin();
	} else {
		// 未ログイン
		currentUID = null;
		onLogout();
	}
});

// ログインフォームが送信されたらログインする
// $("#login-form").on("submit", e => {
$('#login-form').submit((e) => {
	e.preventDefault();
	// フォームを初期状態に戻す
	resetLoginForm();

	// ログインボタンを押せないようにする
	$('#login__submit-button').prop('disabled', true).text('送信中…');

	const email = $('#login-email').val();
	const password = $('#login-password').val();

	/**
	 * ログインを試みて該当ユーザが存在しない場合は新規作成する
	 * まずはログインを試みる
	 */
	firebase
		.auth()
		.signInWithEmailAndPassword(email, password)
		.catch((error) => {
			console.log('ログイン失敗:', error);
			if (error.code === 'auth/user-not-found') {
				// 該当ユーザが存在しない場合は新規作成する
				firebase
					.auth()
					.createUserWithEmailAndPassword(email, password)
					.then(() => {
						// 作成成功
						console.log('新規ユーザを作成しました');
					})
					.catch(catchErrorOnCreateUser);
			} else {
				catchErrorOnSignIn(error);
			}
		});
});

// ログアウトがクリックされたらログアウトする
$('#logout__link').on('click', (e) => {
	e.preventDefault();

	// ハンバーガーメニューが開いている場合は閉じる
	$('#navbarSupportedContent').collapse('hide');

	firebase
		.auth()
		.signOut()
		.then(() => {
			// ログアウト成功
			window.location.hash = '';
		})
		.catch((error) => {
			console.error('ログアウトに失敗:', error);
		});
});

// ゲストモード
$('#gestcheck').on('click', (e) => {
	$('#login-email').val('user@example.jp');
	$('#login-password').val('password');
});

/************************** フォーム関係 ********************************* */
// form内容の初期化
const resetForm = () => {
	$('#data-form')[0].reset();
	$('#oldphoto').children('img').attr('src', ' ');
	$('#modify-photo,input[type="file"]').val(null);
	$('#preview').children('img').remove();
	$('#preview2').children('img').remove();
};

// 登録フォーム画像プレビュー
function imgPreView(event) {
	var file = event.target.files[0];
	var reader = new FileReader();
	var preview = document.getElementById('preview');
	var previewImage = document.getElementById('previewImage');

	if (previewImage != null) {
		preview.removeChild(previewImage);
	}
	reader.onload = function (event) {
		var img = document.createElement('img');
		img.setAttribute('src', reader.result);
		img.setAttribute('id', 'previewImage');
		img.setAttribute('width', '250px');
		preview.appendChild(img);
	};

	reader.readAsDataURL(file);
}

// 登録ボタンでfirebaseに登録
$('#form_register').on('click', (e) => {
	e.preventDefault();
	// form入力値を変数へ。firebase登録準備
	// 日付

	const ylog = $('#year').val();
	const mlog = $('#month').val();
	const dlog = $('#day').val();

	const timeLog = `${ylog}-${mlog}-${dlog}`;
	// 元気度
	const energyLevel = $('#energy option:selected').val();
	// 食事量
	const mealVolume = $('input[name="meal"]:checked').val();
	// 排泄有無
	const excretionPresence = $('input[name="excretion"]:checked').val();
	// 体重
	var weightLog = $('#weight').val();

	//photo
	const $photoImage = $('#photo');
	const { files } = $photoImage[0];

	if (files.length === 0) {
		return;
	}

	const file = files[0];
	const filename = file.name;
	const photoImageLocation = `photo-images/${filename}`;
	console.log('firebaseへ接続');
	firebase
		.storage()
		.ref(photoImageLocation)
		.put(file) // Storageへファイルアップロードを実行
		.then(() => {
			// Storageへのアップロードに成功したら、Realtime Databaseに画像データを保存する
			const photoData = {
				timeLog,
				energyLevel,
				mealVolume,
				excretionPresence,
				weightLog,
				photoImageLocation,
				createdAt: firebase.database.ServerValue.TIMESTAMP,
			};
			return firebase
				.database()
				.ref(`NecordFormData/${currentUID}/${ylog}${mlog}/${dlog}/`)
				.set(photoData);
		});
	console.log('送信終了');
	$('form #data-form').submit();
	resetForm();
	closeView('form-edit');
	showView('fullcalendar-edit');
});
// 中止ボタン
$('#form_stop').on('click', (e) => {
	// console.log("登録中止");
	closeView('form-edit');
	showView('fullcalendar-edit');
	resetForm();
});

/************************** カレンダー表示後 ********************************* */

// $(".fc-prev-button").on("click", e => {
//   console.log("戻る");
//   //currentyymm−１月
//   const yymm = currentyymm - 1;
//   firstshow(yymm);
// });

$(document).on('click', '.fc-prev-button', function () {
	$('.fc-prev-button').on('click', (e) => {
		console.log('戻る');
		//currentyymm−１月
		const yymm = currentyymm - 1;
		firstshow(yymm);
	});
});

// $(".fc-next-button").on("click", e => {
//   console.log("進む");
//   //currentyymm+１月
//   const yymm = currentyymm + 1;
//   firstshow(yymm);
// });

$(document).on('click', '.fc-next-button', function () {
	$('.fc-next-button').on('click', (e) => {
		console.log('進む');
		//currentyymm−１月
		const yymm = currentyymm + 1;
		firstshow(yymm);
	});
});

// $(".fc-today-button").on("click", e => {
//   console.log("当月");
//   //currentyymmに当月
//   //当年月を求める
//   var dt = new Date(); //現在日時のDateオブジェクトを生成
//   var ldt = new Date(dt.getFullYear(), dt.getMonth() + 1, 0); //今月末日を取得

//   //フォーマット整形
//   var y = ldt.getFullYear();
//   var m = ("00" + (ldt.getMonth() + 1)).slice(-2);
//   var d = ("00" + ldt.getDate()).slice(-2);
//   // var result = y + "/" + m + "/" + d;
//   var yymm = y + m;

//   //コンソールに出力
//   console.log(yymm);
//   firstshow(yymm);
// });

$(document).on('click', '.fc-today-button', function () {
	$('.fc-today-button').on('click', (e) => {
		console.log('当月');
		//currentyymmに当月
		//当年月を求める
		var dt = new Date(); //現在日時のDateオブジェクトを生成
		var ldt = new Date(dt.getFullYear(), dt.getMonth() + 1, 0); //今月末日を取得

		//フォーマット整形
		var y = ldt.getFullYear();
		var m = ('00' + (ldt.getMonth() + 1)).slice(-2);
		var d = ('00' + ldt.getDate()).slice(-2);
		// var result = y + "/" + m + "/" + d;
		var yymm = y + m;

		//コンソールに出力
		console.log(yymm);
		firstshow(yymm);
	});
});

/************************** アカウント関係 ********************************* */

// ヘッダーメニューで「アカウント」を押すとアカウント編集フォームを表示

$('#account').on('click', (e) => {
	showView('account-edit');
	// アカウントの欄に現在の値を入れる
	// $("#accout-id").val(`${currentUID}`);

	// ネコの名前変更
	const catNameRef = firebase
		.database()
		.ref(`NecordAccount/${currentUID}/catName`);

	catNameRef.on('value', function (snapshot) {
		const catNameNow = snapshot.val();
		$('#cat-name').val(`${catNameNow}`);
		console.log(catNameNow);
	});
});

// アカウント編集登録ボタンクリックで登録・アップデート
$('#account_register').on('click', (e) => {
	const newCatName = $('#cat-name').val();
	if (newCatName.length === 0) {
		// 入力されていない場合は何もしない
		return;
	}
	firebase
		.database()
		.ref(`NecordAccount/${currentUID}`)
		.update({
			catName: newCatName,
		})
		.then(() => {
			console.log('登録成功');
		})
		.catch((error) => {
			console.error('削除失敗:', error);
		});
	// Email変更
	var user = firebase.auth().currentUser;
	var newEmail = $('#login-email-edit').val();
	user.updateEmail(newEmail).then(function () {
		console.log('Email変更成功');
	});
	// .catch(function(error) {
	//   console.log("Email変更失敗");
	// });

	// パスワード変更
	var user = firebase.auth().currentUser;
	var newPassword = $('login-password-edit').val();
	user
		.updatePassword(newPassword)
		.then(function () {
			console.log('password変更成功');
		})
		.catch(function (error) {
			console.log('password変更失敗');
		});
	// 後処理
	closeView('account-edit');
	showView('fullcalendar-edit');
});

// 閉じる
$('#account_stop').on('click', (e) => {
	console.log('登録中止');
	closeView('account-edit');
	showView('fullcalendar-edit');
});

// ネコの名前削除
$('#confilm_account_delete').on('click', (e) => {
	firebase
		.database()
		.ref(`NecordAccount/${currentUID}/catName`)
		.remove()
		.then(() => {
			console.log('データベースから削除成功');
		})
		.catch((error) => {
			console.error('削除失敗:', error);
		});
	closeView('account-edit');
	showView('fullcalendar-edit');
});

// ネコの名前が登録されたら変数（cat_name）に代入。カレンダー等に表示させる

/************************** お問い合わせ ********************************* */
// グーグルフォームを利用。リンクページへ飛ばすだけで対応とする
